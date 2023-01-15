import { Cli } from '@moostjs/event-cli'
import { Controller } from 'moost'

@Controller('register')
export class FeRoomCliRegister {
    @Cli('')
    root() {
        return 'register command'
    }
}
