import { panic, TFeRoomConfig, TVueRoute } from 'common'
import { getLockVersion, pkg } from '../utils'
import { readFeRoomConfigFile } from './build'
import { getVueRenderedRoutes } from './vue-routes'

export class FeRoomConfigFile {
    protected files: string[] = [
        './feroom.config.ts',
        './feroom.config.js',
        './feroom.config.json',
    ]

    protected data?: TFeRoomConfig

    protected rendered?: TFeRoomConfig

    constructor(path?: string | TFeRoomConfig) {
        if (typeof path === 'string') {
            this.files = [ path ]
        } else if (typeof path === 'object') {
            this.data = path
        }
    }

    async get(): Promise<TFeRoomConfig> {
        if (!this.data) {
            this.data = await readFeRoomConfigFile(this.files)
        }
        return this.data
    }

    async render(): Promise<TFeRoomConfig> {
        if (!this.rendered) {
            const data = await this.get()
            data.registerOptions = data.registerOptions || {}
            const id = data.registerOptions.id || pkg?.name
            if (!id) throw panic('Could not resolve module id. Please use option "registerOptions.id".')
            if (!data.registerOptions.entry) {
                data.registerOptions.entry = pkg?.module || pkg?.main
            }
            if (data.extensions?.vueRoutes) {
                data.extensions.vueRoutes = getVueRenderedRoutes(data.extensions.vueRoutes as TVueRoute[], id)
            }
            if (data.buildOptions?.dependencies?.lockVersion) {
                data.registerOptions.lockDependency = {}
                for (const dep of data.buildOptions.dependencies.lockVersion) {
                    const version = getLockVersion(dep)
                    data.registerOptions.lockDependency[dep] = version
                }
            }
            this.rendered = data
        }
        return this.rendered
    }   
}
