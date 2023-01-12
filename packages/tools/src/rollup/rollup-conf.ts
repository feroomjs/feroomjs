import { Plugin } from "rollup"
import { pkg } from "../utils"
import { getVirtualIndex } from "../virtual-index"
import { feroomConfPlugin } from "./feroom-plugin"
import virtual from 'rollup-plugin-virtual'
import typescript from 'rollup-plugin-typescript2'

export interface TFeRoomRollupOptions {
    input: string
    feroomConfPath?: string
    output?: string // './dist/index.js'
    plugins?: Plugin[]
}

export function createFeroomRollupConfig(options: TFeRoomRollupOptions) {
    const plugins = []
    if (options.input.endsWith('.ts')) {
        if (!options.plugins?.find(p => ['rpt2', 'rpt', 'typescritpt', 'rollup-plugin-typescript', 'rollup-plugin-typescript2'].includes(p.name))) {
            plugins.push(typescript())
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
