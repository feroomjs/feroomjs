import { Plugin } from 'esbuild'
import { TESReBuildCallback } from '../types'

export const esbuildWatchPlugin: (onReBuild: TESReBuildCallback) => Plugin = (onReBuild) => ({
    name: 'feroom-watch-cb',
    setup(build) {
        // build.onStart(() => logger.dev('Build started'))

        build.onEnd((result) => {
            // logger.dev('Build ended')
            void onReBuild(result)
        })
    },
})
