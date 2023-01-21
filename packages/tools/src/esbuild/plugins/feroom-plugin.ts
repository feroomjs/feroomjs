import { TFeRoomConfig } from 'common'
import { Plugin } from 'esbuild'
import { getVirtualIndex } from '../../virtual'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { buildPath } from '../../utils'

export const esbuildFeRoomPlugin: (conf: TFeRoomConfig) => Plugin = (conf) => ({
    name: 'feroom',
    setup(build) {
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
            if (build.initialOptions.write) {
                writeFileSync(buildPath(path, 'feroom-config.json'), JSON.stringify(conf, null, '  '))
            }
            if (result.outputFiles) {
                const content = JSON.stringify({ ...conf, devServer: undefined }, null, '  ')
                result.outputFiles.push({
                    path: buildPath(path, 'feroom-config.json'),
                    contents: new Uint8Array(Buffer.from(content)),
                    text: content,
                })
            }
        })
    },
})
