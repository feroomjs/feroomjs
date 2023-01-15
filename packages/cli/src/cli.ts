import { Moost, ImportController } from 'moost'
import { FeRoomCliBuild } from './build'
import { FeRoomCliRegister } from './register'

@ImportController(FeRoomCliBuild)
@ImportController(FeRoomCliRegister)
export class FeRoomCli extends Moost {
    constructor() {
        super({ silent: true })
    }
}
