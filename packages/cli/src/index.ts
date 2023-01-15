import { FeRoomCli } from './cli'
import { MoostCli } from '@moostjs/event-cli'
import { getMoostInfact } from 'moost'

getMoostInfact().silent()

const app = new FeRoomCli()
const cli = new MoostCli()
app.adapter(cli)
app.init()
