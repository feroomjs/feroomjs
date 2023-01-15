import { Cli } from '@moostjs/event-cli'
import { Controller } from 'moost'

@Controller('build')
export class FeRoomCliBuild {
    @Cli('')
    root() {
        return 'build command'
    }
}
