import * as esbuild from 'esbuild'
import { logger } from '../logger'

export const esbuildWatchPlugin: (onReBuild: TESReBuildCallback, log?: boolean) => esbuild.Plugin = (onReBuild, log) => {
    let firstRun = true
    return {
        name: 'feroom-watch-cb',
        setup(build) {
            if (log) {
                build.onStart(() => firstRun ? logger.title('Build started...') : logger.title('Change detected. Re-build started...'))
            }

            build.onEnd((result) => {
                // logger.dev('Build ended')
                firstRun = false
                void onReBuild(result)
            })
        },
    }
}

export type TESReBuildCallback = (result: esbuild.BuildResult<esbuild.BuildOptions>) => void | Promise<void>
