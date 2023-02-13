import { Cli, CliParam } from '@moostjs/event-cli'
import { Controller, Injectable, Validate } from 'moost'
import { panic } from 'common'
import { FeRoomConfigFile, logger } from '@feroomjs/tools'
// import { FeRegistry, FeRoom } from '@feroomjs/server'
// import { MoostHttp } from '@moostjs/event-http'
// import * as esbuild from 'esbuild'
// import { WsExt } from './ws'
import { createDevServer } from './dev-server'

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

        const { restart } = await createDevServer(config)

        config.onChange(async () => {
            logger.title('Config change detected.')  
            await restart(config)
        })

        return ''
    }
}
