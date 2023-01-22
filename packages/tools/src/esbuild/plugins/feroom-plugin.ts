import { Plugin } from 'esbuild'
import { getVirtualIndex } from '../../virtual'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { buildPath } from '../../utils'
import { FeRoomConfigFile } from '../../config'

export const esbuildFeRoomPlugin: (conf: FeRoomConfigFile) => Plugin = (conf) => ({
    name: 'feroom',
    setup(build) {
        build.onResolve({ filter: /feroom-virtual-index\.ts$/ }, (args) => {
            return {
                path: resolve(args.resolveDir, 'feroom-virtual-index.ts'),
            }
        })
        build.onLoad({ filter: /feroom-virtual-index\.ts$/ }, async () => ({
            contents: getVirtualIndex(await conf.get()),
            loader: 'ts',
        }))
        build.onResolve({ filter: /^@feroom-ext\// }, () => {
            return { external: true }
        })
        build.onEnd(async (result) => {
            const path = build.initialOptions.outfile ? dirname(build.initialOptions.outfile) : build.initialOptions.outdir || ''
            const renderedConfig = JSON.stringify({...(await conf.render()), devServer: undefined }, null, '  ')
            if (build.initialOptions.write) {
                writeFileSync(buildPath(path, 'feroom.config.json'), renderedConfig)
            }
            if (result.outputFiles) {
                result.outputFiles.push({
                    path: buildPath(path, 'feroom.config.json'),
                    contents: new Uint8Array(Buffer.from(renderedConfig)),
                    text: renderedConfig,
                })
            }
        })
    },
})
