export interface TModuleData<CFG extends object = object> {
    id: string
    version: string
    files: Record<string, string | {type: 'Buffer', data: number[]}>
    config: {
        entry: string
        label?: string
        description?: string
        preloadRoot?: boolean
        preloadScripts?: string | string[]
        preloadCss?: string | string[]
        appendHead?: string
        appendBody?: string
    } & CFG
}

export type TNpmModuleData<CFG extends object = object> = {
    registry?: string,
    name: string,
    version?: string,
} & Partial<TModuleData<CFG>>


export interface TModuleRoutes {
    name: string
    pattern: string
    layout?: string
    component: string
}

export interface TFeRoomOptions {
    modulesPrefixPath?: string
    globals?: object
    title?: string
    preloadCss?: (string | [string, string])[] 
    preloadScript?: (string | [string, string])[]
    preloadModule?: string[]
    body?: string
    head?: string
    importMap?: { [name: string]: string }
}
