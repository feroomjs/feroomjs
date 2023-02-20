import { createHash } from 'crypto'
import { getNpmPackageFiles, getNpmPackageVersion } from '@feroomjs/npm-fetcher'
import { log, panic, TFeRoomConfig, TModuleData, TNpmModuleData } from 'common'
import EventEmitter from 'events'

const registry: {
    [id: string]: {
        activeVersion: string
        versions: {
            [version: string]: TModuleData<object>
        }
    }
} = {}

function safeString(file: string | { type: 'Buffer', data: number[] }) {
    if (typeof file === 'string') return file
    if (file.type === 'Buffer') return Buffer.from(file.data).toString()
    throw new Error('unexpected file type ' + (file.type as string))
}

export class FeRegistry<CFG extends object = object> extends EventEmitter {
    protected busy = false

    normalizeModuleData(data: Partial<TModuleData<CFG>>): TModuleData<CFG> {
        const files = data.files as Record<string, string>
        if (!files) {
            throw panic(`Failed to normallize module "${ data.id as string }": no files in module`)
        }
        let pkg: { name?: string, version?: string, module?: string, exports?: Record<string, string> }
        try {
            pkg = JSON.parse(files['package.json'] || '{}') as Record<string, string>
        } catch (e) {
            panic('Could not parse package.json file')
            console.error(e)
            pkg = {}
        }
        let feConf
        try {
            feConf = JSON.parse(safeString(files['dist/feroom.config.json'] || files['feroom.config.json'] || '{}')) as TFeRoomConfig<CFG>
        } catch (e) {
            panic('Could not parse feroom.config.json file')
            throw e
        }
        feConf.register = feConf.register || {}
        feConf.register.exports = { ...(pkg.exports || {}), ...(feConf.register.exports || {}) }
        feConf.extensions = feConf.extensions || {} as CFG
        Object.assign(feConf.register, data.config?.register || {})
        Object.assign(feConf.extensions, data.config?.extensions || {})
        const etags: Record<string, string> = {}
        for (const [path, data] of Object.entries(files as TModuleData['files'])) {
            const buffer = typeof data === 'string' ? data : data instanceof Buffer ? data : Buffer.from(data.data)
            etags[path] = createHash('sha1').update(buffer).digest('base64')
        }
        const module: TModuleData<CFG> = {
            id: data.id || feConf.register?.id || pkg.name as string,
            version: data.version || pkg.version as string,
            entry: data.entry || feConf.register?.entry || pkg.module as string,
            files,
            etags,
            source: data.source || '',
            activate: !!data.activate,
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

    async registerModule(data: Partial<TModuleData<CFG>>, defaultNpmRegistry = 'https://registry.npmjs.org') {
        const wasNotBusy = !this.busy
        this.busy = true
        try {
            const normData = this.normalizeModuleData(data)
            const module = registry[normData.id] = registry[normData.id] || { activeVersion: normData.version, versions: {}}
            if (normData.activate) {
                module.activeVersion = normData.version
            }
            module.versions[normData.version] = normData
            log(`Module has been registered ${__DYE_CYAN__}${ normData.id } v${ normData.version }. Active version: ${ module.activeVersion }`)
            this.emit('register-module', normData)
            const regOpts = normData.config.register || {}
            const depsToRegister: Record<string, string | TNpmModuleData> = {}
            if (regOpts.dependencies?.autoImport) {
                const pkg = JSON.parse(normData.files['package.json'] as string || '{}') as Record<string, string>
                if (pkg && pkg.dependencies) {
                    Object.assign(depsToRegister, pkg.dependencies)
                }
            }
            if (regOpts.dependencies?.import) {
                for (const [dep, conf] of Object.entries(regOpts.dependencies.import)) {
                    depsToRegister[dep] = conf
                }
            }
            for (const [dep, conf] of Object.entries(depsToRegister)) {
                if (typeof conf === 'string') {
                    await this.registerFromNpm({
                        name: dep,
                        version: conf,
                        activateIfNewer: normData.activate,
                    }, defaultNpmRegistry)
                } else {
                    await this.registerFromNpm({
                        ...conf,
                        name: dep,
                        activateIfNewer: normData.activate,
                    } as TNpmModuleData<CFG>, defaultNpmRegistry) 
                }           
            }
            if (wasNotBusy) {
                this.busy = false
                this.emit('update')
            }
            return {
                ...normData,
                files: Object.keys(normData.files),
            }
        } catch (e) {
            if (wasNotBusy) this.busy = false
            throw e
        }
    }

    async registerFromNpm(npmData: TNpmModuleData<CFG>, defaultNpmRegistry = 'https://registry.npmjs.org') {
        if (!npmData.name) {
            throw panic('Can not register npm module: option "name" is not provided.')
        }
        const registry = npmData.registry || defaultNpmRegistry
        const version = await getNpmPackageVersion(registry, npmData.name, npmData.version)
        const notBelow = version.startsWith('^')
        const exactVersion = notBelow ? version.slice(1) : version
        const exists = this.exists(npmData.name, exactVersion)
        const activeVersion = this.getActiveVersion(npmData.name, true)
        if (npmData.forceRegister && (exists || (notBelow && activeVersion >= exactVersion))) {
            log(`Module ${__DYE_CYAN__}${ npmData.name } v${ version }${ __DYE_GREEN__ } already registered. Nothing changed. Use "forceRegister" option to force re-register of the module.`)
            return 'Module already exists'
        }
        const files = await getNpmPackageFiles(registry, npmData.name, exactVersion)
        const pkg = JSON.parse(files['package.json'] as string || '{}') as Record<string, string>
        let shouldActivate = npmData.activate
        if (!shouldActivate && npmData.activateIfNewer) {
            if (!activeVersion) {
                shouldActivate = true
            } else {
                shouldActivate = activeVersion < exactVersion
            }
        }
        const module: Partial<TModuleData<CFG>> = {
            id: npmData.id || pkg.name || npmData.name,
            version: exactVersion,
            files,
            source: 'npm:' + registry,
            activate: shouldActivate,
        }
        return this.registerModule(module, defaultNpmRegistry)
    }

    readModule(id: string, version?: string): TModuleData<CFG> {
        const reg = registry[id]
        if (!reg) throw panic(`No module "${ id }" found`)
        const ver = version || reg.activeVersion
        if (!reg.versions[ver]) throw panic(`No module version "${ ver }" found for module "${ id }"`)
        return reg.versions[ver] as TModuleData<CFG>
    }

    exists(id: string, version?: string): boolean {
        const reg = registry[id]
        if (reg) {
            const ver = version || reg.activeVersion
            return !!reg.versions[ver]
        }
        return false
    }

    getActiveVersion(id: string, silent = false) {
        const reg = registry[id]
        if (silent) return reg?.activeVersion || ''
        if (!reg) throw panic(`No module "${ id }" found`)
        return reg.activeVersion
    }

    getModulesList(): string[] {
        return Object.keys(registry)
    }

    getAllModules(): TModuleData<CFG>[] {
        const list = this.getModulesList()
        return list.map(id => this.readModule(id))
    }
}
