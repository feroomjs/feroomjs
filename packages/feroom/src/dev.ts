import { Cli } from '@moostjs/event-cli'
import { Controller } from 'moost'
import { useCliContext, useFlag } from '@wooksjs/event-cli'
import { panic } from 'common'
import { buildBundle, FeRoomConfigFile, FeRoomRegister, logger } from '@feroomjs/tools'
import { FeRoom } from '@feroomjs/server'
import { MoostHttp } from '@moostjs/event-http'

@Controller()
export class CliDev {
    @Cli()
    async dev() {
        logger.title('FeRoom Dev Server')

        const { restoreCtx } = useCliContext()
        const confPath = useFlag('c')
        if (typeof confPath !== 'undefined' && typeof confPath !== 'string') throw panic('Key -c must has string value.')

        const config = new FeRoomConfigFile(confPath)
        const configData = await config.get()

        const devServer: Required<(typeof configData)['devServer']> = {
            port: configData.devServer?.port || 3000,
            feroom: {
                ...(configData.devServer?.feroom || {}),
            },
            ext: configData.devServer?.ext || [],
        }

        const service = new FeRoom()

        for (const ext of devServer.ext) {
            service.ext(ext)
        }

        logger.step('Building bundle...')

        const bundlePromise = buildBundle(config)

        logger.step('Starting dev server...')

        const target = `http://localhost:${ devServer.port }`

        service.adapter(new MoostHttp()).listen(devServer.port, () => logger.info('FeRoom dev server is up: ' + target))
        await service.init()

        await bundlePromise

        logger.step('Registering dev module...')

        const fr = new FeRoomRegister({ host: target })
        await fr.register({
            activate: true,
            conf: config,
        })

        restoreCtx()
        return ''
    }
}