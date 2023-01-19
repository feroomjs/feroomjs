import { getMoostInfact, Moost } from 'moost'
import { FeRegistry } from './registry'
import { createProvideRegistry } from '@prostojs/infact'
import { FeRoomServe } from './feroom-serve'
import { FeRoomConfig } from './config'
import { FeRoomIndex } from './index-html'
import { FeRoomApi } from './feroom-api'
import { log, panic, TClassConstructor, TFeRoomExtension, TFeRoomServerOptions } from 'common'
import { feroomMate } from './decorators'
import { isConstructor } from '@prostojs/mate'

interface TWrappedExt { instance: TFeRoomExtension, name: string }

export class FeRoom extends Moost {
    protected _registry: FeRegistry

    protected _config: FeRoomConfig

    protected _ext: (() => Promise<TWrappedExt> | TWrappedExt)[] = []

    constructor(options?: TFeRoomServerOptions, registry?: FeRegistry) {
        super()
        this._registry = registry || new FeRegistry()
        this._config = new FeRoomConfig(options || {})
        this.setProvideRegistry(createProvideRegistry(
            [FeRegistry, () => this._registry],
            [FeRoomConfig, () => this._config],
            ['FEROOM_EXT_ARRAY', () => this._ext],
        ))
        this.registerControllers(FeRoomServe, FeRoomIndex, FeRoomApi)
    }

    async init() {
        await super.init()
        for (const dep of this._config.npmDeps) {
            await this._registry.registerFromNpm(dep)
        }
    }

    ext(...args: (TClassConstructor<TFeRoomExtension> | TFeRoomExtension)[]) {
        const infact = getMoostInfact()
        const thisMeta = feroomMate.read(this)
        const provide = { ...(thisMeta?.provide || {}), ...this.provide }
        for (const ext of args) {
            const meta = feroomMate.read(ext)
            if (!meta?.feroom_isExtension) {
                throw panic('FeRoom.ext() has received class with no @FeRoomExtension decorator. Please use @FeRoomExtension decorator.')
            }
            if (!meta?.feroom_extensionName) {
                throw panic('FeRoom.ext() has received extensiom with no name. Make sure you pass a name to @FeRoomExtension decorator.')
            }
            if (meta?.controller) {
                this.registerControllers(ext)
            }
            if (isConstructor(ext)) {
                this._ext.push(async () => {
                    infact.silent()
                    const instance = await infact.get(ext as TClassConstructor<object>, {provide}) as TFeRoomExtension
                    infact.silent(false)
                    return { instance, name: meta.feroom_extensionName as string }
                })
            } else {
                infact.setProvideRegByInstance(ext, provide)
                this._ext.push(() => ({ instance: ext, name: meta.feroom_extensionName as string }))
            }
            log(`Extension ${ __DYE_BOLD__ }${ meta?.feroom_extensionName }${ __DYE_BOLD_OFF__ + __DYE_DIM__ } has been installed.`)
        }
    }
}
