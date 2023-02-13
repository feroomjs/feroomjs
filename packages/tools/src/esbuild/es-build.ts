import { TFeRoomConfig } from 'common'
import { logger } from '../logger'
import { genEsbuildConfig } from './es-config'
import * as esbuild from 'esbuild'
import { TESReBuildCallback } from './types'
import { FeRoomConfigReader } from '../config'

export async function esBuildBundle(confPath?: string | TFeRoomConfig | FeRoomConfigReader) {
    const config = confPath instanceof FeRoomConfigReader ? confPath : new FeRoomConfigReader(confPath)
    const esbuildConfig = await genEsbuildConfig(config)
    logger.step('Bundling up files...')
    return await esbuild.build(esbuildConfig)
}

export async function esBuildCtx(confPath?: string | TFeRoomConfig | FeRoomConfigReader, onReBuild?: TESReBuildCallback) {
    const config = confPath instanceof FeRoomConfigReader ? confPath : new FeRoomConfigReader(confPath)
    const esbuildConfig = await genEsbuildConfig(config, onReBuild)
    logger.step('Bundling up files...')
    return await esbuild.context(esbuildConfig)
}
