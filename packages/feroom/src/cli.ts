import { Moost } from 'moost'
import { FeRoomCliBuild } from './build'
import { FeRoomCliRegister } from './register'

export class FeRoomCli extends Moost {
    constructor() {
        super({ silent: true })
        this.registerControllers(
            FeRoomCliBuild,
            FeRoomCliRegister,
        )
    }
}
