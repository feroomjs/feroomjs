import { Moost } from 'moost'
import { FeRegistry } from './registry'
import { createProvideRegistry } from '@prostojs/infact'
import { FeRoomServe } from './feroom-serve'
import { TFeRoomOptions } from './types'
import { FeRoomConfig } from './config'
import { FeRoomIndex } from './index-html'

export class FeRoom extends Moost {

    protected _registry: FeRegistry
    protected _config: FeRoomConfig

    constructor(options?: TFeRoomOptions, registry?: FeRegistry) {
        super()
        this._registry = registry || new FeRegistry()
        this._config = new FeRoomConfig(options || {})
        this.setProvideRegistry(createProvideRegistry(
            [FeRegistry, () => this._registry],
            [FeRoomConfig, () => this._config],
        ))
        this.registerControllers(FeRoomServe, FeRoomIndex)
    }
}
