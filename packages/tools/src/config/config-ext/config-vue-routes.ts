import { TVueRoute } from 'common'
import { TFeConfigExt } from '..'
import { pkg } from '../../utils'

export const configVueRoutesExt: TFeConfigExt = {
    transformConfig(data, config) {
        const id = data.registerOptions?.id || pkg?.name
        if (data.extensions?.vueRoutes) {
            data.registerOptions = data.registerOptions || {}
            data.registerOptions.exports = data.registerOptions.exports || {}
            for (const entry of getAllRoutes(data.extensions.vueRoutes)) {
                // "./src/pages/Index.vue" → "./pages_Index" as an export name
                const exportName = './' + getPageName(entry.component, true)
                const pagePath = config.devMode
                    // "./src/pages/Index.vue" → "./src/pages/Index.vue" for vite dev
                    ? entry.component
                    // "./src/pages/Index.vue" → "<outDir>/pages_Index.js" for prod
                    : config.outPath(getPageName(entry.component))
                data.registerOptions.exports[exportName] = pagePath
            }
            data.extensions.vueRoutes = getVueRenderedRoutes(data.extensions.vueRoutes, id)
        }
        console.log('data.registerOptions', data.registerOptions)
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

function getVueRenderedRoutes(vueRoutes: TVueRoute[], moduleId: string) {
    const _routes = JSON.parse(JSON.stringify(vueRoutes)) as TVueRoute[]
    const entries = getAllRoutes(_routes)
    // "./src/pages/Index.vue" → "async () => (await import('<moduleId>/pages_Index'))"
    for (const entry of entries) {
        if (entry.component && !entry.component.startsWith('async () => ')) {
            entry.component = `async () => (await import('${ moduleId }/${ getPageName(entry.component, true) }'))`
        }
    }
    return _routes
}
