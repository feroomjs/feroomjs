import { FeRoomCli } from './cli'
import { MoostCli } from '@moostjs/event-cli'
import { getMoostInfact } from 'moost'

export { TFeRoomConfig } from 'common'

export const cli = () => {
    getMoostInfact().silent()

    const app = new FeRoomCli()
    const cli = new MoostCli()
    app.adapter(cli)
    app.init()
}

export * from 'common/types'
