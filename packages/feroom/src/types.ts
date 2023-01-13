import { TFeRoomConfig } from 'common'

export interface TModuleData<EXT extends object = object> {
    id: string
    version: string
    files: Record<string, string | {type: 'Buffer', data: number[]}>
    entry: string
    config: TFeRoomConfig<EXT>
    activate?: boolean
}

export type TNpmModuleData<EXT extends object = object> = {
    registry?: string,
    name: string,
    version?: string,
} & Partial<TModuleData<EXT>>


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
