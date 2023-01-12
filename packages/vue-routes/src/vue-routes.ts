import { FeRegistry, TModuleData } from 'feroom'
import { Get } from '@moostjs/event-http'
import { useSetHeader } from '@wooksjs/event-http'
import { Controller } from 'moost'

export interface TVueRoute {
    path: string
    component?: string
    children?: TVueRoute[]
    name?: string
    props?: boolean
}

export interface TRoutesCfg { vueRoutes?: TVueRoute[] }

@Controller()
export class VueRoutesController {
    constructor(protected _registry: FeRegistry) {}

    getModuleRoutes(module: TModuleData<TRoutesCfg>): TVueRoute[] {
        return module.config.vueRoutes || []
    }

    renderProp(name: string, value: string, indent: string = '') {
        return `${ indent }  ${ JSON.stringify(name) }: ${ JSON.stringify(value) }`
    }

    renderFunc(name: string, value: string, indent: string = '') {
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

    @Get('/feroom-dynamic/vue-routes.js')
    routes() {
        try {
            useSetHeader('content-type').value = 'application/javascript'
        } catch(e) {
            //
        }
        const routes = this._registry.getAllModules().map(m => this.getModuleRoutes(m)).flat(1)

        let content = ''

        for (const route of routes) {
            content += this.renderRoute(route) + ',\n'
        }

        return `export const vueRoutes = [${ content }]\nexport default vueRoutes`
    }
}
