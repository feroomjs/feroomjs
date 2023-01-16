import { Cli } from '@moostjs/event-cli'
import { Controller } from 'moost'
import { buildBundle } from '@feroomjs/tools'
import { useFlag } from '@wooksjs/event-cli'
import { panic } from 'common'


@Controller()
export class FeRoomCliBuild {
    @Cli()
    async build() {
        const confPath = useFlag('c')
        if (typeof confPath !== 'undefined' && typeof confPath !== 'string') throw panic('Key -c must has string value.')

        await buildBundle(confPath)
        
        return '✔ Bundle built'
    }
}
