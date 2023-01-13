import { buildPath, pkg } from '../utils'
import { getVirtualIndex } from '../virtual-index'
import { feroomConfPlugin } from './feroom-plugin'
import virtual from 'rollup-plugin-virtual'
import { readFileSync } from 'node:fs'
import { log, panic, TFeRoomRollupOptions } from 'common'
import { Plugin } from 'rollup'

export async function createFeroomRollupConfig(buildOptions: TFeRoomRollupOptions) {
    const plugins: Plugin[] = []
    if (buildOptions.input?.endsWith('.ts') || buildOptions.ts) {
        await appendIfNotExists(
            ['rpt2', 'rpt', 'typescritpt', 'rollup-plugin-typescript', 'rollup-plugin-typescript2'], 
            async () => (await import('@rollup/plugin-typescript')).default(typeof buildOptions.ts === 'boolean' ? undefined : buildOptions.ts),
            'Could not append rollup plugin rollup-plugin-typescript2. Please check if it\'s installed "npm i -sD rollup-plugin-typescript2"'
        )
    }
    if (buildOptions.vue) {
        await appendIfNotExists(
            ['vue'], 
            async () => (await import('rollup-plugin-vue')).default(), // typeof buildOptions.vue === 'boolean' ? undefined : buildOptions.vue
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
    if (buildOptions.nodeResolve) {
        await appendIfNotExists(
            ['node-resolve'], 
            async () => (await import('@rollup/plugin-node-resolve')).default(typeof buildOptions.nodeResolve === 'boolean' ? { browser: true } : buildOptions.nodeResolve),
            'Could not append rollup plugin @rollup/plugin-node-resolve. Please check if it\'s installed "npm i -sD @rollup/plugin-node-resolve"'
        )
    }
    const paths: Record<string, string> = {}
    if (buildOptions.dependencies?.lockVersion) {
        for (const dep of buildOptions.dependencies.lockVersion) {
            const version = JSON.parse(readFileSync(buildPath('node_modules', dep, 'package.json')).toString()).version
            paths[dep] = `${ dep }@${ version }`
            log(`Locking version of "${ dep }" to v${ version }`)
        }
    }
    if (buildOptions.dependencies?.bundle) {
        for (const dep of buildOptions.dependencies.bundle) {
            log(`Bundling in "${ dep }"`)
        }
    }
    return {
        input: './virtual-index.js',
        output: {
            file: buildOptions.output || './dist/index.js',
            inlineDynamicImports: true,
            format: 'es',
            sourcemap: true,
            paths,
        },
        external: Object.keys(pkg.dependencies).filter(dep => !(buildOptions.dependencies?.bundle || []).includes(dep)),
        plugins: [
            virtual({
                './virtual-index.js': getVirtualIndex(buildOptions.input, buildOptions.feroomConfPath),
            }),
            ...plugins,
            ...(buildOptions.plugins || []),
            feroomConfPlugin(buildOptions.feroomConfPath),
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
