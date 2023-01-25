import { Plugin } from 'esbuild'
import { logger } from '../../logger'
import { TESReBuildCallback } from '../types'

export const esbuildWatchPlugin: (onReBuild: TESReBuildCallback, log?: boolean) => Plugin = (onReBuild, log) => {
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
