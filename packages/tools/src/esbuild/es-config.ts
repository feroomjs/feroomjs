import { BuildOptions, Plugin } from 'esbuild'
import { FeRoomConfigFile } from '../config'
import pluginVue from 'esbuild-plugin-vue-next'
import { sassPlugin } from 'esbuild-sass-plugin'
import { esbuildFeRoomPlugin } from './es-plugin'
import { TESReBuildCallback } from './types'

export async function genEsbuildConfig(config: FeRoomConfigFile, onReBuild?: TESReBuildCallback): Promise<BuildOptions> {
    const conf = await config.get()
    const buildOptions = conf.buildOptions || {}
    const plugins: Plugin[] = [
        pluginVue(),
        sassPlugin({
            quietDeps: true,
        }),
        esbuildFeRoomPlugin(conf, onReBuild),
    ]
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
