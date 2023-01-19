import { Cli, CliParam } from '@moostjs/event-cli'
import { Controller, Injectable, Required, Validate } from 'moost'
import { panic } from 'common'
import { FeRoomRegister, logger } from '@feroomjs/tools'

@Injectable('FOR_EVENT')
@Controller()
export class CliRegister {
    @CliParam(['c', 'configPath'], 'Path to the FeRoom Config file.')
    @Validate(({ value: v }) => typeof v !== 'undefined' && typeof v !== 'string' ? 'string value expected with path to FeRoom Config file.' : true)
    configPath?: string

    @Required()
    @CliParam(['h', 'host'], 'FeRoom server Host to register module.')
    host?: string

    @Cli()
    async register() {
        logger.title('FeRoom Register')

        if (typeof this.configPath !== 'undefined' && typeof this.configPath !== 'string') throw panic('Key -c must have string value.')

        if (!this.host || typeof this.host !== 'string') throw panic('Key -h required with the target host of FeRoom server.')
        if (!this.host.startsWith('http')) throw panic(`Host "${ this.host }" has wrong format. It must start with "http".`)
        if (this.host.search('://') < 4) throw panic(`Host "${ this.host }" has wrong format. Use full host string like "http://localhost:3000" etc...`)

        logger.info('Target host: ' + this.host)

        const fr = new FeRoomRegister({ host: this.host })
        await fr.register({
            activate: true,
            conf: this.configPath,
        })

        return ''
    }
}
