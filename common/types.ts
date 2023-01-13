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
    preloadRoot?: boolean
    preloadScripts?: string | string[]
    preloadCss?: string | string[]
    appendHead?: string
    appendBody?: string
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
