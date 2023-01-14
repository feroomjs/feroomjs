import { FeRegistry, FeRoomExtension, TFeRoomExtension } from 'feroom'
import { Get, SetHeader } from '@moostjs/event-http'
import { Controller } from 'moost'
import { TModuleData } from 'common'

export interface TMenuItem {
    icon?: string
    route?: string
    children?: Record<string, TMenuItem>
    description?: string
    params?: Record<string, string>
}

export type TSharedMenu = Record<string, TMenuItem>

export interface TSharedMenuCfg { sharedMenu?: TSharedMenu }

@FeRoomExtension('Shared-Menu')
@Controller()
export class SharedMenuExt implements TFeRoomExtension {
    constructor(protected _registry: FeRegistry) {}

    injectImportMap(): Record<string, string> {
        return { '@feroom-ext/shared-menu': '/feroom-ext/shared-menu.js' }
    }

    getModuleMenu(module: TModuleData<TSharedMenuCfg>): TSharedMenu {
        return module.config.extensions?.sharedMenu || {}
    }

    @Get('/feroom-ext/shared-menu.js')
    @SetHeader('content-type', 'application/javascript')
    menu() {
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
