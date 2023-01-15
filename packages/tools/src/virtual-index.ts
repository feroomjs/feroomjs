import { TFeRoomRollupOptions } from 'common'
import { getVueRoutes, getVueRoutesExports } from './vue-routes'
import { getFeConf } from './fe-conf'
import { dirname, join } from 'path'
import { pkg } from './utils'

export function getVirtualIndex(buildOptions: TFeRoomRollupOptions) {
    const conf = getFeConf(buildOptions.feroomConfPath)
    let content = ''
    if (buildOptions.input) {
        content += `export * from '${ buildOptions.input }';\n`
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
    content += getVueRoutesExports(getVueRoutes(buildOptions.feroomConfPath))
    return content
}
