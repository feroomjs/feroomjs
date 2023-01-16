import { HttpError, useSetHeader, useStatus, WooksHttp } from '@wooksjs/event-http'
import { Controller } from 'moost'
import { useRouteParams } from 'wooks'
import { FeRegistry } from './registry'
import { log, TModuleData } from 'common'
import { FeRoomConfig } from './config'
import { FeModule } from './module'

@Controller()
export class FeRoomServe {
    constructor(protected _registry: FeRegistry, protected wHttp: WooksHttp, protected config: FeRoomConfig) {
        this.updateModulePaths()
        this._registry.on('register-module', (module) => this.registerHttpModulePath(module))
    }

    protected registered: Record<string, boolean> = {}

    registerHttpModulePath(data: TModuleData) {
        if (!this.registered[data.id]) {
            const serve = () => {
                return this.serveModule(data.id, useRouteParams().get('version') as string)
            }
            const serveFile = () => {
                return this.serveModule(data.id, useRouteParams().get('version') as string, useRouteParams().get('*') as string)
            }
            this.registered[data.id] = true
            this.wHttp.get(this.config.modulesPrefixPath + data.id, serve)
            this.wHttp.get(this.config.modulesPrefixPath + data.id + '/*', serveFile)
            this.wHttp.get(this.config.modulesPrefixPath + data.id + '@:version', serve)
            this.wHttp.get(this.config.modulesPrefixPath + data.id + '@:version' + '/*', serveFile)
            log(`• ${__DYE_CYAN__}(GET)${__DYE_GREEN__}/${ this.config.modulesPrefixPath + data.id } → FeRoomServe[${ data.id }]`)
        }
        return data
    }

    serveModule(id: string, version?: string, path?: string) {
        const status = useStatus()
        const location = useSetHeader('location')
        const contentType = useSetHeader('content-type')
        const module = new FeModule(this._registry.readModule(id, version), this.config)
        if (!path) {
            status.value = 307
            location.value = '/' + module.entryPath(version)
            return ''
        }
        const ext = (path.split('.').pop() || '') as keyof typeof extensions
        contentType.value = extensions[ext] || 'text/plain'
        const data = module.files[path]
        if (typeof data === 'string') {
            return data
        } else if (data instanceof Buffer) {
            return data
        } else if (typeof data === 'object' && data.type === 'Buffer') {
            return Buffer.from(data.data)
        }
        return new HttpError(404)
    }

    updateModulePaths() {
        const list = this._registry.getModulesList()
        for (const item of list) {
            const module = this._registry.readModule(item)
            this.registerHttpModulePath(module)
        }
    }
}

const extensions = { 
    'js': 'application/javascript',
    'mjs': 'application/javascript',
    'json': 'application/json',
    'map': 'application/json',
    'cjs': 'application/node',
    'xhtml': 'application/xhtml+xml',
    'otf': 'font/otf',
    'ttf': 'font/ttf',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'css': 'text/css',
    'csv': 'text/csv',
    'html': 'text/html',
    'htm': 'text/html',
    'shtml': 'text/html',
    'jsx': 'text/jsx',
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    'png': 'image/png',
    'svg': 'image/svg+xml',
    'svgz': 'image/svg+xml',
    'webp': 'image/webp',
    'md': 'text/markdown',
}
