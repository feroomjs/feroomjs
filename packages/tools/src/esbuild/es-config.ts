import { BuildOptions, Plugin } from 'esbuild'
import { FeRoomConfigFile } from '../config'
import { TESReBuildCallback } from './types'
import { esbuildFeRoomPlugin, esbuildWatchPlugin } from './plugins'

export async function genEsbuildConfig(config: FeRoomConfigFile, onReBuild?: TESReBuildCallback): Promise<BuildOptions> {
    const conf = await config.get()
    const buildOptions = conf.buildOptions || {}
    const plugins: Plugin[] = []
    if (conf.buildOptions?.vue) {
        plugins.push(((await import('esbuild-plugin-vue-next'))).default())
    }
    if (conf.buildOptions?.css) {
        plugins.push(((await import('esbuild-sass-plugin'))).sassPlugin())
    }
    plugins.push(esbuildFeRoomPlugin(conf))
    if (onReBuild) {
        plugins.push(esbuildWatchPlugin(onReBuild))
    }
    return {
        entryPoints: ['./feroom-virtual-index.ts'], // [buildOptions.input || ''],
        bundle: true,
        packages: 'external',
        format: 'esm',
        write: !onReBuild,
        outfile: buildOptions.output || '',
        plugins,
    }
}
