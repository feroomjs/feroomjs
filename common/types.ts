import { Plugin } from 'rollup'

export interface TFeRoomExtionsOptionsAll {
    sharedMenu?: object
    vueRoutes?: object[]
}

export interface TFeRoomConfig<EXT extends object = TFeRoomExtionsOptionsAll> {
    registerOptions?: TFeRoomRegisterOptions
    buildOptions?: TFeRoomRollupOptions
    extensions?: EXT
}

export interface TFeRoomRegisterOptions {
    id?: string
    entry?: string
    label?: string
    description?: string
    include?: string[]
    exclude?: string[]
    preloadEntry?: boolean | 'head' | 'body:first' | 'body:last'
    preloadScripts?: string | string[]
    preloadCss?: string | string[]
    appendHead?: string
    appendBody?: string
    globals?: object
    lockDependency?: {
        [name: string]: string
    }
    importNpmDependencies?: {
        [name: string]: TNpmModuleData
    }
}

export interface TFeRoomRollupOptions {
    input?: string
    ts?: boolean | object
    vue?: boolean | object
    css?: string | object
    nodeResolve?: object
    dependencies?: {
        bundle?: string[]
        lockVersion?: string[]
    }
    feroomConfPath?: string
    output?: string // './dist/index.js'
    plugins?: Plugin[]
}

export interface TModuleData<EXT extends object = object> {
    id: string
    version: string
    files: Record<string, string | {type: 'Buffer', data: number[]}>
    entry: string
    source: string
    config: TFeRoomConfig<EXT>
    activate?: boolean
}

export type TNpmModuleData<EXT extends object = object> = {
    registry?: string
    name: string
    version?: string
    rebuildIfExists?: boolean
} & Partial<TModuleData<EXT>>
