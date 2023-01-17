import { Cli, CliParam } from '@moostjs/event-cli'
import { Controller, Injectable, Validate } from 'moost'
import { buildBundle, logger } from '@feroomjs/tools'
import { panic } from 'common'

@Injectable('FOR_EVENT')
@Controller()
export class CliBuild {
    @CliParam(['c', 'configPath'], 'Path to the FeRoom Config file.')
    @Validate(v => typeof v !== 'undefined' && typeof v !== 'string' ? 'string value expected with path to FeRoom Config file.' : true)
    configPath?: string

    @Cli()
    async build() {
        logger.title('FeRoom Build')

        if (typeof this.configPath !== 'undefined' && typeof this.configPath !== 'string') throw panic('Key -c must have string value.')

        await buildBundle(this.configPath)
        
        logger.info('\n✔ Build done')

        return ''
    }
}
