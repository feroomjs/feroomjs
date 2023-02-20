import { TVueRoute } from 'common'
import { TFeConfigExt } from '..'
import { pkg } from '../../utils'

export const configVueRoutesExt: TFeConfigExt = {
    transformConfig(data, config) {
        const id = data.register?.id || pkg?.name
        if (data.extensions?.vueRoutes) {
            data.register = data.register || {}
            data.register.exports = data.register.exports || {}
            for (const entry of getAllRoutes(data.extensions.vueRoutes)) {
                // "./src/pages/Index.vue" → "./pages_Index" as an export name
                const exportName = './' + getPageName(entry.component, true)
                const pagePath = config.devMode
                    // "./src/pages/Index.vue" → "./src/pages/Index.vue" for vite dev
                    ? entry.component
                    // "./src/pages/Index.vue" → "<outDir>/pages_Index.js" for prod
                    : config.outPath(getPageName(entry.component))
                data.register.exports[exportName] = pagePath
            }
            const { preloadCss } = config.getBuildHelpers()
            data.extensions.vueRoutes = getVueRenderedRoutes(data.extensions.vueRoutes, id, pkg.version, preloadCss)
        }
        return data
    },
    appendEntries(data) {
        const entries: Record<string, string> = {}
        if (data.extensions?.vueRoutes) {
            const routes = getAllRoutes(data.extensions.vueRoutes)
            for (const entry of routes) {
                const name = getPageName(entry.component)
                entries[name] = entry.component
            }
        }
        return entries
    },
}

function getPageName(path: string, skipExt = false) {
    // "./src/pages/Index.vue" → "pages_Index.js"
    return path
        .replace(/\.vue$/, '')
        .replace(/^.\//, '')
        .replace(/^src\//, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_') + ( skipExt ? '' : '.js')
}

function getAllRoutes(vueRoutes: TVueRoute[]) {
    const routes: TVueRoute[] = []
    iterateChildren(vueRoutes)
    function iterateChildren(root: TVueRoute[]) {
        for (const entry of root) {
            if (entry.component) {
                routes.push(entry)
            }
            if (entry.children) {
                iterateChildren(entry.children)
            }
        }
    }
    return routes as (TVueRoute & { component: string })[]
}

function getVueRenderedRoutes(vueRoutes: TVueRoute[], moduleId: string, version: string, preloadCss: string) {
    const _routes = JSON.parse(JSON.stringify(vueRoutes)) as TVueRoute[]
    const entries = getAllRoutes(_routes)
    // "./src/pages/Index.vue" → "async () => (await import('<moduleId>/pages_Index'))"
    for (const entry of entries) {
        if (entry.component && !entry.component.startsWith('async () => ')) {
            const css = preloadCss
                ? `feUtils.preloadCss(${ 
                    JSON.stringify(moduleId)
                }, ${
                    JSON.stringify(preloadCss)
                }, ${
                    JSON.stringify(version)
                }); `
                : ''
            entry.component = `async () => { ${css}return (await import('${ moduleId }/${ getPageName(entry.component, true) }')) }`
        }
    }
    return _routes
}
