import { TFeRoomConfig, TFeRoomExtensionsOptionsAll } from 'common'

export function defineConfig(config: TFeRoomConfig) {
    return config
}

export function defineBuild(config: TFeRoomConfig['build']) {
    return config
}

export function defineRegister(config: TFeRoomConfig['register']) {
    return config
}

export function defineDevServer(config: TFeRoomConfig['devServer']) {
    return config
}

export function defineExt<EXT = TFeRoomExtensionsOptionsAll>(config: EXT) {
    return config
}
