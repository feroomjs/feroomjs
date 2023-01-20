import { TFeRoomConfig } from 'common'
import { FeRoomConfigFile } from '../config'
import { logger } from '../logger'
import { genEsbuildConfig } from './es-config'
import * as esbuild from 'esbuild'
import { TESReBuildCallback } from './types'

export async function esBuildBundle(confPath?: string | TFeRoomConfig | FeRoomConfigFile) {
    const config = confPath instanceof FeRoomConfigFile ? confPath : new FeRoomConfigFile(confPath)
    const esbuildConfig = await genEsbuildConfig(config)
    logger.step('Bundling up files...')
    return await esbuild.build(esbuildConfig)
}

export async function esBuildCtx(confPath?: string | TFeRoomConfig | FeRoomConfigFile, onReBuild?: TESReBuildCallback) {
    const config = confPath instanceof FeRoomConfigFile ? confPath : new FeRoomConfigFile(confPath)
    const esbuildConfig = await genEsbuildConfig(config, onReBuild)
    logger.step('Bundling up files...')
    return await esbuild.context(esbuildConfig)
}
