import { TFeRoomRegisterOptions } from 'common'
import { FeRoomConfig } from './config'
import { TModuleData } from './types'
import { join } from 'path'
import { renderCssTag, renderModuleScriptTag } from './utils'

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

    buildPath(path: string): string {
        return join(this.config.modulesPrefixPath, this.data.id, path)
    }

    entryPath(): string {
        return this.buildPath(this.getRegisterOptions().entry || '')
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

    getImportMap(): Record<string, string> {
        const map: Record<string, string> = {}
        if (this.hasEntry()) {
            map[this.data.id] = './' + this.entryPath()
        }
        return map
    }
}
