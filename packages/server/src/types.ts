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
