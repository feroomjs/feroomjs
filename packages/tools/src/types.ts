export interface TFeRoomConfig {
    id?: string
    entry?: string
    label?: string
    description?: string
    preloadRoot?: boolean
    preloadScripts?: string | string[]
    preloadCss?: string | string[]
    appendHead?: string
    appendBody?: string
    sharedMenu?: object
    vueRoutes?: object[]
    include?: string[]
    exclude?: string[]
}
