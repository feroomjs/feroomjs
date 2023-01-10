export interface TModuleData {
    label?: string
    description?: string
    id: string
    version: string
    files: Record<string, string>
    rootFile: string
}

export type TNpmModuleData = {
    registry?: string,
    name: string,
    version?: string,
} & Partial<TModuleData>


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
}
