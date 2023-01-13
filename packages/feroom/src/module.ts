import { TFeRoomRegisterOptions } from 'common'
import { FeRoomConfig } from './config'
import { TModuleData } from './types'
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

    getRegisterOptions(): TFeRoomRegisterOptions {
        return this.data.config.registerOptions || {}
    }

    getExtensions(): EXT | undefined {
        return this.data.config.extensions
    }

    buildPath(path: string, version?: string): string {
        return join(this.config.modulesPrefixPath, this.data.id + (version ? `@${ version }` : ''), path)
    }

    entryPath(version?: string): string {
        return this.buildPath(this.getRegisterOptions().entry || '', version)
    }

    hasEntry(): boolean {
        return !!this.getRegisterOptions().entry
    }

    renderPreloadCss(): string {
        const items = [this.getRegisterOptions().preloadCss || []].flat(1)
        return items.map(path => renderCssTag(this.buildPath(path))).join('\n') + '\n'
    }

    renderPreloadScript(): string {
        const items = [this.getRegisterOptions().preloadScripts || []].flat(1)
        return items.map(path => renderModuleScriptTag(this.buildPath(path))).join('\n') + '\n'
    }

    renderPreloadModule(): string {
        return renderModuleScriptTag(this.entryPath())
    }

    getImportMap(reg: FeRegistry): Record<string, string> {
        const map: Record<string, string> = {}
        if (this.hasEntry()) {
            map[this.data.id] = '/' + this.entryPath()
        }
        if (this.data.config.registerOptions?.lockDependency) {
            for (const [dep, ver] of Object.entries(this.data.config.registerOptions.lockDependency)) {
                const m = reg.readModule(dep, ver)
                if (m) {
                    map[m.id + '@' + ver] = '/' + (new FeModule(m, this.config).entryPath(ver))
                }
            }
        }
        return map
    }
}
