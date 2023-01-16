import { Plugin } from 'rollup'
import { TSharedMenuCfg } from './shared-menu.types'
import { TVueRoutesCfg } from './vue-route.types'

export type TFeRoomExtensionsOptionsAll = TSharedMenuCfg & TVueRoutesCfg

export interface TFeRoomConfig<EXT extends object = TFeRoomExtensionsOptionsAll> {
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
    forceRegister?: boolean
} & Partial<TModuleData<EXT>>

export type TClassConstructor<T = unknown> = new (...args : any[]) => T

export * from './vue-route.types'
export * from './shared-menu.types'
