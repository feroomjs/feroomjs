import { TFeRoomConfig } from 'common'
import { Plugin } from 'esbuild'
import { getVirtualIndex } from '../rollup/virtual-index'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { buildPath } from '../utils'
import { TESReBuildCallback } from './types'
import { logger } from '../logger'

export const esbuildFeRoomPlugin: (conf: TFeRoomConfig, onReBuild?: TESReBuildCallback) => Plugin = (conf, onReBuild) => ({
    name: 'feroom',
    setup(build) {
        build.onStart(() => onReBuild ? logger.dev('Build started') : undefined)
        build.onResolve({ filter: /feroom-virtual-index\.ts$/ }, (args) => {
            return {
                path: resolve(args.resolveDir, 'feroom-virtual-index.ts'),
            }
        })
        build.onLoad({ filter: /feroom-virtual-index\.ts$/ }, () => ({
            contents: getVirtualIndex(conf),
            loader: 'ts',
        }))
        build.onResolve({ filter: /^@feroom-ext\// }, () => {
            return { external: true }
        })
        build.onEnd((result) => {
            const path = build.initialOptions.outfile ? dirname(build.initialOptions.outfile) : build.initialOptions.outdir || ''
            if (onReBuild) {
                logger.dev('Build ended')
                const content = JSON.stringify(conf, null, '  ')
                void onReBuild({
                    ...result,
                    outputFiles: [
                        ...(result.outputFiles || []),
                        {
                            path: buildPath(path, 'feroom-config.json'),
                            contents: new Uint8Array(Buffer.from(content)),
                            text: content,
                        },
                    ],
                }, path)
            } else if (build.initialOptions.write) {
                writeFileSync(buildPath(path, 'feroom-config.json'), JSON.stringify(conf, null, '  '))
            }
        })
    },
})
