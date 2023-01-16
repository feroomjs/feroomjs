import { panic, TFeRoomConfig } from 'common'
import { FeRoomConfigFile } from '../config'
import { createFeRoomRollupConfig } from './rollup-conf'
import { rollup, RollupError }  from 'rollup'
import { buildPath } from '../utils'
import { dirname } from 'path'
import { mkdirSync, writeFileSync } from 'fs'
import { logger } from '../logger'
export * from './feroom-plugin'
export * from './rollup-conf'

export async function buildBundle(confPath?: string | TFeRoomConfig | FeRoomConfigFile) {
    const config = confPath instanceof FeRoomConfigFile ? confPath : new FeRoomConfigFile(confPath)
    const rollupConfig = await createFeRoomRollupConfig(config)
    try {
        logger.step('Bundling up files...')
        const bundle = await rollup(rollupConfig)
        if (rollupConfig.output && !Array.isArray(rollupConfig.output)) {
            const { output } = await bundle.generate(rollupConfig.output)
            const dir = dirname(rollupConfig.output.file || '')
            mkdirSync(dir, { recursive: true})
            for (const chunkOrAsset of output) {
                const path = buildPath(dir, chunkOrAsset.fileName)
                mkdirSync(dirname(path), { recursive: true})
                const dts = chunkOrAsset.fileName.endsWith('.d.ts')
                logger.info(`• → ${ __DYE_GREEN__ }${dts ? __DYE_DIM__ + __DYE_CYAN__ : ''}${ chunkOrAsset.fileName }`)
                if (chunkOrAsset.type === 'asset') {
                    writeFileSync(path, chunkOrAsset.source)
                } else {
                    writeFileSync(path, chunkOrAsset.code)
                }
            }
        }
    } catch (e) {
        const re = e as RollupError
        let message
        if (re.cause && re.code && re.frame) {
            message = re.code + '\n' + __DYE_BOLD_OFF__ + __DYE_WHITE__ + re.frame
        } else {
            message = (e as Error).message
        }
        throw panic(message)
    }
}
