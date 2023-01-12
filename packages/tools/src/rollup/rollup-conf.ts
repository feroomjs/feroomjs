import { Plugin } from "rollup"
import { pkg } from "../utils"
import { getVirtualIndex } from "../virtual-index"
import { feroomConfPlugin } from "./feroom-plugin"
import virtual from 'rollup-plugin-virtual'

export interface TFeRoomRollupOptions {
    input: string
    vue?: boolean
    css?: string | object
    feroomConfPath?: string
    output?: string // './dist/index.js'
    plugins?: Plugin[]
}

export async function createFeroomRollupConfig(options: TFeRoomRollupOptions) {
    const plugins = []
    if (options.input.endsWith('.ts')) {
        if (!options.plugins?.find(p => ['rpt2', 'rpt', 'typescritpt', 'rollup-plugin-typescript', 'rollup-plugin-typescript2'].includes(p.name))) {
            const typescript = (await import('rollup-plugin-typescript2')).default
            plugins.push(typescript())
        }
    }
    if (options.vue) {
        if (!options.plugins?.find(p => ['vue'].includes(p.name))) {
            const vue = (await import('rollup-plugin-vue')).default
            plugins.push(vue())
        }
    }
    if (options.css) {
        if (!options.plugins?.find(p => ['scss'].includes(p.name))) {
            const scss = (await import('rollup-plugin-scss')).default
            plugins.push(scss( typeof options.css === 'string' ? { fileName: options.css } : options.css ))
        }
    }
    return {
        input: './virtual-index.js',
        output: {
            file: options.output || './dist/index.js',
            inlineDynamicImports: true,
            format: 'es',
            sourcemap: true,
        },
        external: Object.keys(pkg.dependencies),
        plugins: [
            virtual({
                './virtual-index.js': getVirtualIndex(options.input, options.feroomConfPath),
            }),
            ...plugins,
            ...(options.plugins || []),
            feroomConfPlugin(options.feroomConfPath),
        ]
    }
}
