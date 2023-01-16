import { FeRegistry, FeRoomExtension, TFeRoomExtension } from '@feroomjs/server'
import { Get, SetHeader } from '@moostjs/event-http'
import { Controller } from 'moost'
import { logError, TModuleData } from 'common'
import { TVueRoute, TVueRoutesCfg } from 'common'

@FeRoomExtension('VueRoutes')
@Controller()
export class VueRoutesExt implements TFeRoomExtension {
    constructor(protected _registry: FeRegistry) {}

    injectImportMap(): Record<string, string> {
        return { '@feroom-ext/vue-routes': '/feroom-ext/vue-routes.js' }
    }

    getModuleRoutes(module: TModuleData<TVueRoutesCfg>): TVueRoute[] {
        return module.config.extensions?.vueRoutes || []
    }

    renderProp(name: string, value: string, indent: string = '') {
        return `${ indent }  ${ JSON.stringify(name) }: ${ JSON.stringify(value) }`
    }

    renderFunc(name: string, value: string, indent: string = '') {
        if (typeof value === 'boolean') {
            return this.renderProp(name, value, indent)
        }
        if (typeof value !== 'string') {
            logError(`Prop "${ name }" has unsupported type "${ typeof value }"`)
            return `${ indent }  ${ JSON.stringify(name) }: null`
        }
        if (value.startsWith('(') || value.startsWith('async ') || value.startsWith('function')) {
            return `${ indent }  ${ JSON.stringify(name) }: ${ value }`
        }
        return this.renderProp(name, value, indent)
    }

    renderRoute(route: TVueRoute, indent: string = '') {
        let s = `${ indent }{\n`

        for (const [name, value] of Object.entries(route)) {
            switch (name) {
                case 'path':
                case 'name':
                    s += this.renderProp(name, value, indent) + ',\n'
                    break;
                case 'children':
                    if (value && Array.isArray(value)) {
                        s += `${ indent }  "children": [\n`
                        for (const child of value) {
                            s += this.renderRoute(child, indent + '  ') + ',\n'
                        }
                        s += `${ indent }  ],\n`
                    }
                    break;
                default: s += this.renderFunc(name, value, indent) + ',\n'
            }
        }
        return s + `${ indent }}`
    }

    @Get('/feroom-ext/vue-routes.js')
    @SetHeader('content-type', 'application/javascript')
    routes() {
        const routes = this._registry.getAllModules().map(m => this.getModuleRoutes(m)).flat(1)

        let content = ''

        for (const route of routes) {
            content += this.renderRoute(route) + ',\n'
        }

        return `export const vueRoutes = [${ content }]\nexport default vueRoutes`
    }
}
