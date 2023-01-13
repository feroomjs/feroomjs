import { getNpmPackageFiles } from '@feroomjs/npm-fetcher'
import { log, panic, TFeRoomConfig } from 'common'
import EventEmitter from 'events'
import { TModuleData, TNpmModuleData } from './types'


const registry: {
    [id: string]: {
        activeVersion: string
        versions: {
            [version: string]: TModuleData<object>
        }
    }
} = {}

export class FeRegistry<CFG extends object = object> extends EventEmitter {

    normalizeModuleData(data: Partial<TModuleData<CFG>>): TModuleData<CFG> {
        const files = data.files as Record<string, string>
        if (!files) {
            throw panic(`Failed to normallize module "${ data.id }": no files in module`)
        }
        const pkg = JSON.parse(files['package.json'] || '{}') as Record<string, string>
        const feConf = JSON.parse(files['dist/feroom.config.json'] as string || files['feroom.config.json'] as string || '{}') as TFeRoomConfig<CFG>
        feConf.registerOptions = feConf.registerOptions || {}
        feConf.extensions = feConf.extensions || {} as CFG
        Object.assign(feConf.registerOptions, data.config?.registerOptions || {})
        Object.assign(feConf.extensions, data.config?.extensions || {})
        const module: TModuleData<CFG> = {
            id: data.id || feConf.registerOptions?.id || pkg.name,
            version: data.version || pkg.version,
            entry: data.entry || feConf.registerOptions?.entry || pkg.module,
            files,
            config: feConf,
        }
        if (!module.id) {
            throw panic(`Failed to normallize module "${ module.id }": missing "id".`)
        }
        if (!module.entry) {
            throw panic(`Failed to normallize module "${ module.id }": missing "entry". Please make sure package.json has "module" value.`)
        }
        return module
    }

    registerModule(data: Partial<TModuleData<CFG>>) {
        const normData = this.normalizeModuleData(data)
        const module = registry[normData.id] = registry[normData.id] || { activeVersion: normData.version, versions: {}}
        if (normData.activate) {
            module.activeVersion = normData.version
        }
        module.versions[normData.version] = normData
        log(`Module has been registered ${__DYE_CYAN__}${ normData.id } v${ normData.version }. Active version: ${ module.activeVersion }`)
        this.emit('register-module', normData)
        return {
            ...normData,
            files: Object.keys(normData.files),
        }
    }

    async registerFromNpm(npmData: TNpmModuleData<CFG>) {
        const files = await getNpmPackageFiles(npmData.registry || 'https://registry.npmjs.org', npmData.name, npmData.version)
        const pkg = JSON.parse(files['package.json'] || '{}') as Record<string, string>
        const module: Partial<TModuleData<CFG>> = {
            id: npmData.id || pkg.name || npmData.name,
            version: pkg.version,
            files,
        }
        return this.registerModule(module)
    }

    readModule(id: string, version?: string): TModuleData<CFG> {
        const reg = registry[id]
        if (!reg) throw panic(`No module "${ id }" found`)
        const ver = version || reg.activeVersion
        if (!reg.versions[ver]) throw panic(`No module version "${ ver }" found for module "${ id }"`)
        return reg.versions[ver] as TModuleData<CFG>
    }

    getModulesList(): string[] {
        return Object.keys(registry)
    }

    getAllModules(): TModuleData<CFG>[] {
        const list = this.getModulesList()
        return list.map(id => this.readModule(id))
    }
}
