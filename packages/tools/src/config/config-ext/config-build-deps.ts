import { TFeConfigExt } from '..'
import { logger } from '../../logger'
import { getLockVersion } from '../../utils'

export const configBuildDepsExt: TFeConfigExt = {
    transformConfig(data) {
        data.register = data.register || {}
        const depOptions = data.register.dependencies = data.register.dependencies || {}
        if (data.build?.dependencies?.lockVersion) {
            depOptions.lock = depOptions.lock || {}
            for (const dep of data.build.dependencies.lockVersion) {
                const version = getLockVersion(dep)
                depOptions.lock[dep] = version
                if (depOptions.import && depOptions.import[dep]) {
                    const npmDep = depOptions.import[dep]
                    if (npmDep.version && npmDep.version !== version) {
                        logger.warn(`registerOptions.importNpmDependencies["${dep}"] has different version from what's installed in node_modules. Changing version to ${ version }.`)
                    }
                    npmDep.version = version
                }
            }
        }
        if (data.build?.dependencies?.bundle && depOptions.import) {
            for (const dep of data.build.dependencies.bundle) {
                const npmDep = depOptions.import[dep]
                if (npmDep) {
                    logger.warn(`When bundling "${ dep }" it must be wrong to pass importNpmDependencies["${dep}"] as there should not be such external dependency.`)
                }
            }
        }
        if (data.build?.dependencies?.bundle && data.build?.dependencies?.lockVersion) {
            for (const dep of data.build.dependencies.bundle) {
                if (data.build.dependencies.lockVersion.includes(dep)) {
                    logger.warn(`Dependency "${ dep }" set for locking version and for bundling in. Only one of the options make sense.`)
                }
            }
        }
        return data
    },
}
