import { getNpmPackageFiles } from "@feroomjs/npm-fetcher";
import { log } from "common/log";
import { panic } from "common/panic";
import EventEmitter from "events";
import { TModuleData, TNpmModuleData } from "./types";


const registry: {
    [id: string]: {
        [version: string]: TModuleData
    }
} = {}

export class FeRegistry extends EventEmitter {
    registerModule(data: TModuleData) {
        const module = registry[data.id] = registry[data.id] || {}
        module[data.version] = data
        const latest = Object.keys(module).filter(a => a !== 'latest').sort((a, b) => a > b ? 1 : -1).pop() as string
        module.latest = module[latest]
        log(`Module has been registered ${__DYE_CYAN__}${ data.id } v${ data.version }`)
        this.emit('register-module', data)
        return {
            ...data,
            files: Object.keys(data.files),
        }
    }

    async registerFromNpm(npmData: TNpmModuleData) {
        const files = await getNpmPackageFiles(npmData.registry || 'https://registry.npmjs.org', npmData.name, npmData.version)
        const pkg = JSON.parse(files['package.json'] || '{}') as Record<string, string>
        const module: TModuleData = {
            id: npmData.id || pkg.name || npmData.name,
            description: npmData.description || pkg.description,
            label: npmData.label,
            rootFile: npmData.rootFile || pkg.module || pkg.main,
            version: pkg.version,
            files,
        }
        return this.registerModule(module)
    }    

    readModule(id: string, version?: string): TModuleData {
        if (!registry[id]) throw panic(`No module "${ id }" found`)
        const ver = version || 'latest'
        if (!registry[id][ver]) throw panic(`No module version "${ ver }" found for module "${ id }"`)
        return registry[id][ver] as TModuleData
    }

    getModulesList() {
        return Object.keys(registry)
    }
}
