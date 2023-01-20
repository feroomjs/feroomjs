import { TFeRoomConfig, TVueRoute } from 'common'
import { dirname, join } from 'path'
import { getVueRoutesExports } from '../config/vue-routes'
import { pkg } from '../utils'

export function getVirtualIndex(conf: TFeRoomConfig) {
    const buildOptions = conf.buildOptions || {}
    let content = ''
    if (buildOptions.input) {
        content += `export * from '${ buildOptions.input.replace(/\.ts$/, '') }';\n`
    }
    if (buildOptions.css) {
        const cssOpts = buildOptions.css as (string | { fileName: string })
        let cssPath
        if (typeof cssOpts === 'string') {
            cssPath = cssOpts
        } else if (cssOpts.fileName) {
            cssPath = cssOpts.fileName
        }
        if (cssPath) {
            cssPath = join(dirname(buildOptions.output || ''), cssPath)
            content += `__loadCss(window.__feroom.modulesPrefixPath + '${ conf.registerOptions?.id || pkg.name }/${ cssPath }');\n`
        }
    }
    content += getVueRoutesExports(conf.extensions?.vueRoutes as TVueRoute[] || [])
    return content
}
