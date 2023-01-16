import { Cli } from '@moostjs/event-cli'
import { Controller } from 'moost'
import { useFlag } from '@wooksjs/event-cli'
import { panic } from 'common'
import { FeRoomRegister } from '@feroomjs/tools'

@Controller()
export class FeRoomCliRegister {
    @Cli()
    async register() {
        const confPath = useFlag('c')
        if (typeof confPath !== 'undefined' && typeof confPath !== 'string') throw panic('Key -c must has string value.')

        const target = useFlag('t')
        if (!target || typeof target !== 'string') throw panic('Key -t required with the target FeRoom server.')
        if (!target.startsWith('http')) throw panic(`Target "${ target }" has wrong format. It must start with "http".`)
        if (target.search('://') < 4) throw panic(`Target "${ target }" has wrong format. Use full host string like "http://localhost:3000" etc...`)

        const fr = new FeRoomRegister({ host: target })
        await fr.register({
            activate: true,
            conf: confPath,
        })

        return '✔ Module registered'
    }
}
