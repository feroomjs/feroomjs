import { Moost, validatePipe } from 'moost'
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
                console.error(error.stack)
                process.exit(1)
            })
        })
        this.applyGlobalPipes(validatePipe())
    }
}
