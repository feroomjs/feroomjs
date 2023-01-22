import { BuildOptions, Plugin } from 'esbuild'
import { FeRoomConfigFile } from '../config'
import { TESReBuildCallback } from './types'
import { esbuildFeRoomPlugin, esbuildWatchPlugin } from './plugins'
import { getLockVersion, pkg } from '../utils'
import { logger } from '../logger'

export async function genEsbuildConfig(config: FeRoomConfigFile, onReBuild?: TESReBuildCallback): Promise<BuildOptions> {
    const conf = await config.get()
    const buildOptions = conf.buildOptions || {}
    const plugins: Plugin[] = []
    if (conf.buildOptions?.vue) {
        plugins.push(((await import('esbuild-plugin-vue-next'))).default())
    }
    if (conf.buildOptions?.css) {
        plugins.push(((await import('esbuild-sass-plugin'))).sassPlugin({
            quietDeps: true,
        }))
    }
    plugins.push(esbuildFeRoomPlugin(config))
    if (onReBuild) {
        plugins.push(esbuildWatchPlugin(onReBuild))
    }
    const paths: Record<string, string> = {}
    if (buildOptions.dependencies?.lockVersion) {
        for (const dep of buildOptions.dependencies.lockVersion) {
            const version = getLockVersion(dep)
            paths[dep] = `${ dep }@${ version }`
            logger.step(`Locking version of "${ dep }" to v${ version }`)
        }
    }    
    if (buildOptions.dependencies?.bundle) {
        for (const dep of buildOptions.dependencies.bundle) {
            logger.step(`Bundling in "${ dep }"`)
        }
    }
    const bundle = buildOptions.dependencies?.bundle ? [buildOptions.dependencies?.bundle].flat(1) : []    
    return {
        entryPoints: ['./feroom-virtual-index.ts'], // [buildOptions.input || ''],
        alias: paths, // from buildOptions.dependencies.lockVersion
        bundle: true,
        external: [
            // extrnalising dependencies
            ...Object.keys(pkg.dependencies || {}).filter(dep => !bundle.includes(dep)),
            ...Object.keys(pkg.peerDependencies || {}).filter(dep => !bundle.includes(dep)),

            // externalising from buildOptions.dependencies.lockVersion
            ...Object.entries(paths).map(p => p[1]),

            // ext dynamic imports
            '@feroom-ext/*',
        ],
        format: 'esm',
        write: !onReBuild,
        outfile: buildOptions.output || '',
        plugins,
    }
}
