import { TFeRoomRegisterOptions, TModuleData } from 'common'
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
        return join(this.config.modulesPrefixPath, this.data.id + `@${ version || this.data.version }`, path)
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

    getImportMap(reg: FeRegistry): Record<string, string> {
        const map: Record<string, string> = {}
        if (this.hasEntry()) {
            map[this.data.id] = '/' + this.entryPath(this.data.version)
        }
        if (this.data.config.registerOptions?.lockDependency) {
            for (const [dep, ver] of Object.entries(this.data.config.registerOptions.lockDependency)) {
                // const active = reg.getActiveVersion(dep)
                const m = reg.readModule(dep, ver)
                if (m) {
                    map[m.id + '@' + ver] = '/' + (new FeModule(m, this.config).entryPath(ver))
                }
            }
        }
        return map
    }
}
