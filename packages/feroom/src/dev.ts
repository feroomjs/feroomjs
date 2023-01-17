import { Cli, CliParam } from '@moostjs/event-cli'
import { Controller, Injectable, Validate } from 'moost'
import { useCliContext } from '@wooksjs/event-cli'
import { panic } from 'common'
import { buildBundle, FeRoomConfigFile, FeRoomRegister, logger } from '@feroomjs/tools'
import { FeRoom } from '@feroomjs/server'
import { MoostHttp } from '@moostjs/event-http'

@Injectable('FOR_EVENT')
@Controller()
export class CliDev {
    @CliParam(['c', 'configPath'], 'Path to the FeRoom Config file.')
    @Validate(v => typeof v !== 'undefined' && typeof v !== 'string' ? 'string value expected with path to FeRoom Config file.' : true)
    configPath?: string

    @Cli()
    async dev() {
        logger.title('FeRoom Dev Server')

        const { restoreCtx } = useCliContext()
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

        const server = new FeRoom()

        for (const ext of devServer.ext) {
            void server.ext(ext)
        }

        logger.step('Building bundle...')

        const filesPromise = buildBundle(config, false)

        logger.step('Starting dev server...')

        const target = `http://localhost:${ devServer.port }`

        void server.adapter(new MoostHttp()).listen(devServer.port, () => logger.info('FeRoom dev server is up: ' + target))
        await server.init()

        const files = await filesPromise

        logger.step('Registering dev module...')

        const fr = new FeRoomRegister({ host: target })
        await fr.register({
            activate: true,
            conf: config,
            files,
        })

        restoreCtx()
        return ''
    }
}
