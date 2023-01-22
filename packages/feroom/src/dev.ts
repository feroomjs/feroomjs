import { Cli, CliParam } from '@moostjs/event-cli'
import { Controller, Injectable, Validate } from 'moost'
import { isTextFile, panic } from 'common'
import { FeRoomConfigFile, logger, esBuildCtx, FeRoomRegister, unbuildPath } from '@feroomjs/tools'
import { FeRegistry, FeRoom } from '@feroomjs/server'
import { MoostHttp } from '@moostjs/event-http'
import { WsExt } from './ws'

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

        const config = new FeRoomConfigFile(this.configPath, true)

        await fireDevServer()

        async function fireDevServer() {
            const configData = await config.get()

            const devServer: Required<(typeof configData)['devServer']> = {
                port: configData.devServer?.port || 3000,
                shared: configData.devServer?.shared || '',
                feroom: {
                    ...(configData.devServer?.feroom || {}),
                },
                ext: configData.devServer?.ext || [],
            }

            // const listeners: (() => void)[] = []
            let target = ''
            if (devServer.shared) {
                logger.step('Connecting to shared dev server: ' + devServer.shared)
                logger.warn('devServer.feroom and devServer.ext options will be ignored, because shared dev server option is picked.')
                target = devServer.shared
            } else {
                const reg = new FeRegistry()
                const server = new FeRoom({}, reg)
                // server.setProvideRegistry(createProvideRegistry(['feroom-dev-server-event', () => (cb: () => void) => { listeners.push(cb) }]))
        
                for (const ext of devServer.ext) {
                    void server.ext(ext)
                }
                void server.ext(WsExt)  

                logger.step('Starting dev server...')
        
                target = `http://localhost:${ devServer.port }`
        
                void server.adapter(new MoostHttp()).listen(devServer.port, () => logger.dev('FeRoom dev server is up: ' + target))
                await server.init()                 
            }
   
            logger.step('Building bundle...')
    
            const ctx = await esBuildCtx(config, async (result) => {
                logger.clear()
                logger.dev('Registering dev module after re-build...')
        
                const outputFiles: Record<string, string | Buffer> = {};
                
                (result.outputFiles || []).forEach(f => outputFiles[unbuildPath(f.path)] = isTextFile(f.path) ? Buffer.from(f.contents).toString() : Buffer.from(f.contents)) // 
    
                const fr = new FeRoomRegister({ host: target })
                await fr.register({
                    activate: true,
                    conf: config,
                    files: outputFiles,
                })
                logger.dev('Dev module has been registered ✔')
                // listeners.forEach(l => l())
            })
    
            await ctx.watch()   

            config.onChange(async () => {
                await ctx.rebuild()
            })   
        }

        return ''
    }
}
