import { FeRegistry, TModuleData } from 'feroom'
import { Get } from '@moostjs/event-http'
import { useSetHeader } from '@wooksjs/event-http'
import { Controller } from 'moost'

export interface TMenuItem {
    icon?: string
    route?: string
    children?: Record<string, TMenuItem>
    description?: string
    params?: Record<string, string>
}

export type TSharedMenu = Record<string, TMenuItem>

export interface TSharedMenuCfg { sharedMenu?: TSharedMenu }

@Controller()
export class SharedMenuController {
    constructor(protected _registry: FeRegistry) {}

    getModuleMenu(module: TModuleData<TSharedMenuCfg>): TSharedMenu {
        return module.config.extensions?.sharedMenu || {}
    }

    @Get('/feroom-dynamic/shared-menu.js')
    menu() {
        try {
            useSetHeader('content-type').value = 'application/javascript'
        } catch (e) {
            //
        }
        const menus = this._registry.getAllModules().map(m => this.getModuleMenu(m))
        let mergedMenu: TSharedMenu = {}
        for (const menu of menus) {
            mergedMenu = mergeMenu(menu, mergedMenu)
        }
        function mergeMenu(menu: TSharedMenu, target: TSharedMenu): TSharedMenu {
            for (const [key, data] of Object.entries(menu)) {
                const tChildren = target[key] && target[key].children || {}
                const tMenus = target[key] = { ...(target[key] || {}), ...data }
                if (data.children) {
                    tMenus.children = mergeMenu(data.children, tChildren)
                }
            }
            return target
        }
        return `export const sharedMenu = ${ JSON.stringify(mergedMenu, null, '  ') }\nexport default sharedMenu`
    }
}
