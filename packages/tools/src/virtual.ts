import { TFeRoomConfig } from 'common'
import { dirname, join } from 'path'
// import { getVueRoutesExports } from './config/vue-routes'
import { pkg } from './utils'

export function getVirtualIndex(conf: TFeRoomConfig, viteDev = false) {
    const buildOptions = conf.buildOptions || {}
    let content = ''
    if (buildOptions.input) {
        content += `export * from '${ viteDev
            ? buildOptions.input.replace(/^\./, '')
            : buildOptions.input.replace(/\.ts$/, '') }';\n`
    }
    if (!viteDev && buildOptions.css) {
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
    // content += getVueRoutesExports(conf.extensions?.vueRoutes as TVueRoute[] || [], viteDev)
    return content
}
