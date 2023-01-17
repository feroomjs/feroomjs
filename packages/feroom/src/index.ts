import { FeRoomCli } from './cli'
import { MoostCli } from '@moostjs/event-cli'
import { getMoostInfact } from 'moost'

export { TFeRoomConfig } from 'common'

export const cli = () => {
    supressNodeWarnings()
    getMoostInfact().silent()
    const app = new FeRoomCli()
    const cli = new MoostCli()
    app.adapter(cli)
    void app.init()
}

function supressNodeWarnings() {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { emitWarning } = process
    process.emitWarning = (warning, ...args) => {
        if (args[0] === 'ExperimentalWarning') {
            return
        }

        if (args[0] && typeof args[0] === 'object' && args[0].type === 'ExperimentalWarning') {
            return
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return emitWarning(warning, ...args)
    }    
}

export * from 'common/types'
