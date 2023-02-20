import { Body, Post } from '@moostjs/event-http'
import { Controller } from 'moost'
import { FeRegistry } from './registry'
import { TModuleData, TNpmModuleData } from 'common'
import { FeRoomConfig } from './config'

@Controller()
export class FeRoomApi {
    constructor(protected _registry: FeRegistry, private config: FeRoomConfig) {}

    protected registered: Record<string, boolean> = {}
    
    @Post('feroom-module/register')
    registerModule(@Body() module: Partial<TModuleData>) {
        return this._registry.registerModule(module, this.config.defaultNpmRegistry)
    }

    @Post('feroom-module/register/npm')
    async registerFromNpm(@Body() npmData: TNpmModuleData) {
        return await this._registry.registerFromNpm(npmData, this.config.defaultNpmRegistry)
    }
}
