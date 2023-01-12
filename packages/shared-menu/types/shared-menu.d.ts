// FeRoom dynamic module "@feroom-dynamic/shared-menu"
declare module '@feroom-dynamic/shared-menu' {
    export interface TMenuItem {
        icon?: string
        route?: string
        children?: Record<string, TMenuItem>
        description?: string
        params?: Record<string, string>
    }
    
    export type TSharedMenu = Record<string, TMenuItem>
        
    export const sharedMenu: TSharedMenu
}
