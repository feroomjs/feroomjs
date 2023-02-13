import { TFeConfigExt } from '..'
import { logger } from '../../logger'
import { getLockVersion } from '../../utils'

export const configBuildDepsExt: TFeConfigExt = {
    transformConfig(data) {
        data.registerOptions = data.registerOptions || {}
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
        return data
    },
}
