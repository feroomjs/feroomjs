import { Cli, CliParam } from '@moostjs/event-cli'
import { Controller, Injectable, Validate } from 'moost'
import { panic } from 'common'
import { FeRoomConfigFile, logger, esBuildCtx, FeRoomRegister, unbuildPath } from '@feroomjs/tools'
import { FeRegistry, FeRoom } from '@feroomjs/server'
import { MoostHttp } from '@moostjs/event-http'
import { WsExt } from './ws'
import { createProvideRegistry } from '@prostojs/infact'

@Injectable('FOR_EVENT')
@Controller()
export class CliDev {
    @CliParam(['c', 'configPath'], 'Path to the FeRoom Config file.')
    @Validate(({ value: v }) => typeof v !== 'undefined' && typeof v !== 'string' ? 'string value expected with path to FeRoom Config file.' : true)
    configPath?: string

    @Cli()
    async dev() {
        logger.title('FeRoom Dev Server')

        if (typeof this.configPath !== 'undefined' && typeof this.configPath !== 'string') throw panic('Key -c must has string value.')

        const config = new FeRoomConfigFile(this.configPath)
        const configData = await config.get()

        const devServer: Required<(typeof configData)['devServer']> = {
            port: configData.devServer?.port || 3000,
            feroom: {
                ...(configData.devServer?.feroom || {}),
            },
            ext: configData.devServer?.ext || [],
        }

        const reg = new FeRegistry()
        const server = new FeRoom({}, reg)
        const listeners: (() => void)[] = []
        server.setProvideRegistry(createProvideRegistry(['feroom-dev-server-event', () => (cb: () => void) => { listeners.push(cb) }]))

        for (const ext of devServer.ext) {
            void server.ext(ext)
        }
        void server.ext(WsExt)     

        logger.step('Building bundle...')

        const ctx = await esBuildCtx(config, async (result) => {
            logger.clear()
            logger.dev('Registering dev module after re-build...')
    
            const outputFiles: Record<string, string | Buffer> = {};
            
            (result.outputFiles || []).forEach(f => outputFiles[unbuildPath(f.path)] = Buffer.from(f.contents)) // 

            const fr = new FeRoomRegister({ host: target })
            await fr.register({
                activate: true,
                conf: config,
                files: outputFiles,
            })
            logger.dev('Dev module has been registered ✔')
            listeners.forEach(l => l())
        })

        await ctx.watch()

        // const { watcher, outputOptions } = await watchBundle(config)

        // watcher.on('event', async (data) => {
        //     if (data.code === 'BUNDLE_END' && outputOptions && !Array.isArray(outputOptions)) {
        //         const { output } = await data.result.generate(outputOptions)
        //         // await data.result.write(outputOptions)
        //         await data.result.close()
        //         const dir = dirname(outputOptions.file || '')
        //         const outputFiles: Record<string, string | Buffer> = {}
        //         function toBuffer(file: string | Uint8Array) {
        //             return typeof file === 'string' ? file : Buffer.from(file)
        //         }
        //         output.forEach(f => outputFiles[join(dir, f.fileName)] = toBuffer(f.type === 'asset' ? f.source : f.code))

        //         // const files = await filesPromise
        
        //         logger.step('Registering dev module...')
        
        //         reg.registerModule({
        //             id: pkg.name,
        //             version: pkg.version + '-' + String(new Date().getTime()),
        //             source: 'dev-server',
        //             activate: true,
        //             config: await config.render(),
        //             files: outputFiles,
        //         })

        //         // const fr = new FeRoomRegister({ host: target })

        //         // await fr.register({
        //         //     activate: true,
        //         //     conf: config,
        //         //     files: outputFiles,
        //         // })
        //     }
        // })

        // watcher.on('change', (id, { event }) => { 
        //     console.log('changed ' + id, event)
        // })

        logger.step('Starting dev server...')
        
        const target = `http://localhost:${ devServer.port }`

        void server.adapter(new MoostHttp()).listen(devServer.port, () => logger.dev('FeRoom dev server is up: ' + target))
        await server.init()   

        return ''
    }
}
