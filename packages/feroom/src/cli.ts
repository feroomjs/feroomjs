import { Moost } from 'moost'
import { CliBuild } from './build'
import { CliDev } from './dev'
import { CliRegister } from './register'

export class FeRoomCli extends Moost {
    constructor() {
        super({ silent: true })
        this.registerControllers(
            CliBuild,
            CliRegister,
            CliDev,
        )
        this.applyGlobalInterceptors((before, after, onError) => {
            onError((error) => {
                console.error(error.message)
                process.exit(1)
            })
        })
    }
}
