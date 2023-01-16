import { Plugin, RollupOptions } from 'rollup'
import { getLockVersion, pkg } from '../utils'
import { getVirtualIndex } from './virtual-index'
import { feRoomConfPlugin } from './feroom-plugin'
import virtual from 'rollup-plugin-virtual'
import nodeResolve from '@rollup/plugin-node-resolve'
import { panic } from 'common'
import { FeRoomConfigFile } from '../config'
import { logger } from '../logger'

const defaultTs = {
    tsconfigOverride: {
        compilerOptions: { noImplicitAny: false },
    }
}

export async function createFeRoomRollupConfig(config: FeRoomConfigFile): Promise<RollupOptions> {
    const conf = await config.get()
    const buildOptions = conf.buildOptions || {}
    const plugins: Plugin[] = []
    if (buildOptions.input?.endsWith('.ts') || buildOptions.ts) {
        await appendIfNotExists(
            ['rpt2', 'rpt', 'typescritpt', 'rollup-plugin-typescript', 'rollup-plugin-typescript2'], 
            async () => (await import('rollup-plugin-typescript2')).default(typeof buildOptions.ts === 'boolean' ? defaultTs : buildOptions.ts),
            'Could not append rollup plugin rollup-plugin-typescript2. Please check if it\'s installed "npm i -sD rollup-plugin-typescript2"'
        )        
    }
    if (buildOptions.vue) {
        await appendIfNotExists(
            ['vue'], 
            async () => (await import('rollup-plugin-vue')).default(typeof buildOptions.vue === 'boolean' ? undefined : buildOptions.vue), // 
            'Could not append rollup plugin rollup-plugin-vue. Please check if it\'s installed "npm i -sD rollup-plugin-vue"'
        )        
    }
    if (buildOptions.css) {
        await appendIfNotExists(
            ['scss'],
            async () => (await import('rollup-plugin-scss')).default(typeof buildOptions.css === 'string' ? { fileName: buildOptions.css } : buildOptions.css),
            'Could not append rollup plugin rollup-plugin-scss. Please check if it\'s installed "npm i -sD rollup-plugin-scss"'
        )        
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
        input: './virtual-index.js',
        output: {
            file: buildOptions.output || './dist/index.js',
            inlineDynamicImports: true,
            format: 'es',
            sourcemap: true,
            paths,
        },
        external: [
            ...Object.keys(pkg.dependencies || {}).filter(dep => !bundle.includes(dep)),
            ...Object.keys(pkg.peerDependencies || {}).filter(dep => !bundle.includes(dep)),
            // ext dynamic imports
            '@feroom-ext/vue-routes',
            '@feroom-ext/shared-menu',
        ],
        plugins: [
            virtual({
                './virtual-index.js': getVirtualIndex(conf),
            }),
            ...plugins,
            ...(buildOptions.plugins || []),
            nodeResolve(buildOptions.nodeResolve || { browser: true }),
            feRoomConfPlugin(await config.render()),
        ]
    }
    
    async function appendIfNotExists(names: string[], cb: () => Promise<Plugin> | Plugin, errorText?: string) {
        try {
            if (!buildOptions.plugins || !buildOptions.plugins.find(p => names.includes(p.name))) {
                plugins.push(await cb())
            }
        } catch (e) {
            throw panic(errorText || 'Could not append rollup plugin.\n' + (e as Error).message)
        }
    }
}
