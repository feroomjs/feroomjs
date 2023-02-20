import { Plugin } from 'rollup'
import { TSharedMenuCfg } from './shared-menu.types'
import { TVueRoutesCfg } from './vue-route.types'

export type TFeRoomExtensionsOptionsAll = TSharedMenuCfg & TVueRoutesCfg

export interface TFeRoomConfig<EXT extends object = TFeRoomExtensionsOptionsAll> {
    devServer?: TFeRoomDevServerOptions
    register?: TFeRoomRegisterOptions
    build?: TFeRoomBuildOptions
    extensions?: EXT
}

export interface TFeRoomRegisterOptions {
    id?: string
    entry?: string
    label?: string
    description?: string
    include?: string[]
    exclude?: string[]
    indexHtml?: {
        preloadEntry?: boolean | 'head' | 'body:first' | 'body:last'
        preloadScripts?: string | string[]
        preloadCss?: string | string[]
        appendHead?: string
        appendBody?: string
        globals?: object
    }
    dependencies?: {
        autoImport?: boolean
        lock?: {
            [name: string]: string
        }
        import?: {
            [name: string]: TNpmModuleData
        }
    }
    exports?: Record<'.' | `./${ string }` | string, string | { import?: string, default?: string }>
}

export interface TFeRoomBuildOptions {
    input?: string
    vue?: boolean | object
    preloadCss?: boolean
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
    files: Record<string, string | {type: 'Buffer', data: number[]} | Buffer>
    etags: Record<string, string>
    entry: string
    source: string
    config: TFeRoomConfig<EXT>
    activate?: boolean
}

export type TNpmModuleData<EXT extends object = object> = {
    registry?: string
    name?: string
    version?: string
    forceRegister?: boolean
    activateIfNewer?: boolean
} & Partial<TModuleData<EXT>>

export interface TFeRoomDevServerOptions {
    port?: number
    shared?: string
    feroom?: TFeRoomServerOptions
    ext?: (TClassConstructor<TFeRoomExtension> | TFeRoomExtension)[]
}

export interface TFeRoomExtension {
    injectGlobals?(): Record<string, unknown>
    injectImportMap?(): Record<string, string>
    injectHead?(): string
    injectIndexBody?(): string
}

export interface TFeRoomServerOptions {
    modulesPrefixPath?: string
    defaultNpmRegistry?: string
    devMode?: boolean
    globals?: object
    title?: string
    preloadCss?: (string | [string, string])[] 
    preloadScript?: (string | [string, string])[]
    preloadModule?: string[]
    body?: string
    head?: string
    importMap?: { [name: string]: string }
    importNpmDependencies?: {
        [name: string]: TNpmModuleData
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TClassConstructor<T = unknown> = new (...args : any[]) => T

export * from './vue-route.types'
export * from './shared-menu.types'

