import { Cli } from '@moostjs/event-cli'
import { Controller } from 'moost'
import { buildBundle, logger } from '@feroomjs/tools'
import { useFlag } from '@wooksjs/event-cli'
import { panic } from 'common'

@Controller()
export class FeRoomCliBuild {
    @Cli()
    async build() {
        logger.title('FeRoom Build')

        const confPath = useFlag('c')
        if (typeof confPath !== 'undefined' && typeof confPath !== 'string') throw panic('Key -c must has string value.')

        await buildBundle(confPath)
        
        logger.info('\n✔ Build done')

        return ''
    }
}
