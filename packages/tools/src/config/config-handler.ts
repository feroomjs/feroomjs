import { panic, TFeRoomConfig } from 'common'
import { dirname } from 'path'
import { logger } from '../logger'
import { getLockVersion, pkg } from '../utils'
import { getVueRenderedRoutes } from './vue-routes'

export class FeRoomConfigHandler {
    constructor(private data: TFeRoomConfig) {}

    protected rendered?: TFeRoomConfig

    get() {
        return this.data
    }

    getBuildHelpers() {
        const configData = this.data
        const buildOptions = configData.buildOptions || {}
        
        // list of deps to bundle in
        const bundle = buildOptions?.dependencies?.bundle ? [buildOptions?.dependencies?.bundle].flat(1) : []   

        // list of deps to lock version { 'depName': 'depName@version' }
        const paths: Record<string, string> = {}
        const versionedExternals: string[] = []
        if (buildOptions.dependencies?.lockVersion) {
            for (const dep of buildOptions.dependencies.lockVersion) {
                const version = getLockVersion(dep)
                paths[dep] = `${ dep }@${ version }`
                versionedExternals.push(`${ dep }@${ version }`)
            }
        }

        // list of deps to lock version
        const lockVersions = Object.keys(paths)

        const target = configData.buildOptions?.output || './dist/index.mjs'
        const outDir = dirname(target)
        const fileName = target.replace(outDir + '/', '').replace(/\.\w+$/, '')
        const ext = (/\.\w+$/.exec(target) || [''])[0]

        const external = [
            // extrnalising dependencies
            ...Object.keys(pkg.dependencies || {}).filter(dep => !bundle.includes(dep)),
            ...Object.keys(pkg.peerDependencies || {}).filter(dep => !bundle.includes(dep)),

            // externalising from buildOptions.dependencies.lockVersion
            ...Object.entries(paths).map(p => p[1]),
            ...versionedExternals,
        ]

        return {
            // list of deps to bundle in
            bundle,

            // list of deps to lock version { 'depName': 'depName@version' }
            paths,

            // dist path (file)
            target,

            // dist dir
            outDir,

            // dist file name
            fileName,

            // file extension 
            ext,

            // list of deps to lock version
            lockVersions,

            // external deps
            external,

            // external deps without locked versions (need to alias with version and exclude afterwards)
            externalNoLock: external.filter(d => !lockVersions.includes(d)),
        }
    }

    render(viteDev = false): TFeRoomConfig {
        if (!this.rendered) {
            const data = JSON.parse(JSON.stringify(this.data)) as TFeRoomConfig
            data.registerOptions = data.registerOptions || {}
            const id = data.registerOptions.id || pkg?.name
            if (!id) throw panic('Could not resolve module id. Please use option "registerOptions.id".')
            if (!data.registerOptions.entry) {
                data.registerOptions.entry = pkg?.module || pkg?.main
            }
            if (data.extensions?.vueRoutes) {
                data.extensions.vueRoutes = getVueRenderedRoutes(data.extensions.vueRoutes, id, viteDev)
            }
            if (data.buildOptions?.dependencies?.lockVersion) {
                data.registerOptions.lockDependency = {}
                for (const dep of data.buildOptions.dependencies.lockVersion) {
                    const version = getLockVersion(dep)
                    data.registerOptions.lockDependency[dep] = version
                    if (data.registerOptions?.importNpmDependencies && data.registerOptions?.importNpmDependencies[dep]) {
                        const npmDep = data.registerOptions.importNpmDependencies[dep]
                        if (npmDep.version && npmDep.version !== version) {
                            logger.warn(`registerOptions.importNpmDependencies["${dep}"] has different version from what's installed in node_modules. Changing version to ${ version }.`)
                        }
                        npmDep.version = version
                    }
                }
            }
            if (data.buildOptions?.dependencies?.bundle && data.registerOptions?.importNpmDependencies) {
                for (const dep of data.buildOptions.dependencies.bundle) {
                    const npmDep = data.registerOptions.importNpmDependencies[dep]
                    if (npmDep) {
                        logger.warn(`When bundling "${ dep }" it must be wrong to pass importNpmDependencies["${dep}"] as there should not be such external dependency.`)
                    }
                }
            }
            if (data.buildOptions?.dependencies?.bundle && data.buildOptions?.dependencies?.lockVersion) {
                for (const dep of data.buildOptions.dependencies.bundle) {
                    if (data.buildOptions.dependencies.lockVersion.includes(dep)) {
                        logger.warn(`Dependency "${ dep }" set for locking version and for bundling in. Only one of the options make sense.`)
                    }
                }
            }
            this.rendered = {
                registerOptions: {
                    ...(data.registerOptions || {}),
                },
                extensions: {
                    ...(data.extensions || {}),
                },
            }
        }
        return this.rendered
    }   
}
