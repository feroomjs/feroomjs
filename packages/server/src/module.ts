import { modulesPrefixPath, TFeRoomRegisterOptions, TModuleData } from 'common'
import { FeRoomConfig } from './config'
import { join } from 'path'
import { renderCssTag, renderModuleScriptTag } from './utils'
import { FeRegistry } from './registry'

export class FeModule<EXT extends object = object> {
    constructor(protected data: TModuleData<EXT>, protected config: FeRoomConfig) {}

    get id() {
        return this.data.id
    }

    get files() {
        return this.data.files
    }

    getGlobals() {
        return this.getRegisterOptions().globals || {}
    }

    getRegisterOptions(): TFeRoomRegisterOptions {
        return this.data.config.registerOptions || {}
    }

    getExtensions(): EXT | undefined {
        return this.data.config.extensions
    }

    buildPath(path: string, version?: string): string {
        if (this.data.source === 'vite') {
            return join('/', path).replace(/^\/+/, '')
        }
        return join(modulesPrefixPath, this.data.id + `@${ version || this.data.version }`, path)
    }

    entryPath(version?: string): string {
        return this.buildPath(this.data.entry || '', version || this.data.version)
    }

    hasEntry(): boolean {
        return !!this.data.entry
    }

    renderPreloadCss(): string {
        const items = [this.getRegisterOptions().preloadCss || []].flat(1)
        let content = ''
        if (items.length) {
            content += this.renderComment('Preload Css')
        }
        return content + items.map(path => renderCssTag(this.buildPath(path))).join('\n') + '\n'
    }

    renderPreloadScript(): string {
        const items = [this.getRegisterOptions().preloadScripts || []].flat(1)
        let content = ''
        if (items.length) {
            content += this.renderComment('Preload Script')
        }
        return content + items.map(path => renderModuleScriptTag(this.buildPath(path))).join('\n') + '\n'
    }

    renderComment(text: string) {
        return `<!-- ${ this.id }@${ this.data.version }: ${ text } -->\n`
    }

    renderPreloadModule(): string {
        return this.renderComment('Preload Entry') + renderModuleScriptTag(this.entryPath())
    }

    getEntries() {
        const entries: Record<string, string> = {}
        for (const [key, value] of Object.entries(this.data.config.registerOptions?.exports || {})) {
            if (key === '.') continue
            const _key = key.replace(/^\./, '').replace(/^\/+/, '')
            if (typeof value === 'string') {
                entries[_key] = value
            } else if (value.import || value.default) {
                entries[_key] = value.import || value.default as string
            }
        }
        return entries
    }

    getOwnImportMap(version?: string) {
        const map: Record<string, string> = {}
        const id = this.data.id + (version ? `@${ version }` : '')
        if (this.hasEntry()) {
            map[id] = '/' + this.entryPath(version || this.data.version)
        }
        for (const [key, value] of Object.entries(this.getEntries())) {
            map[`${ id }/${ key }`] = '/' + this.buildPath(value, version || this.data.version)
        }
        return map
    }

    getImportMap(reg: FeRegistry): Record<string, string> {
        const map = this.getOwnImportMap()
        if (this.data.config.registerOptions?.lockDependency) {
            for (const [dep, ver] of Object.entries(this.data.config.registerOptions.lockDependency)) {
                // const active = reg.getActiveVersion(dep)
                const m = reg.readModule(dep, ver)
                Object.assign(map, (new FeModule(m, this.config).getOwnImportMap(ver)))
            }
        }
        return map
    }
}
