import { TVueRoute } from 'common'

export function getVueRoutesExports(vueRoutes: TVueRoute[], viteDev = false) {
    const map = getVueRoutesMap(vueRoutes)
    let content = ''
    for (const [file, name] of Object.entries(map)) {
        content += `export { default as ${ name } } from '${ viteDev ? file.replace(/\./, '') : file }';\n`
    }
    return content
}

export function getVueRoutesMap(vueRoutes: TVueRoute[]) {
    const components: Record<string, string> = {}
    let i = 0
    iterateChildren(vueRoutes)
    function iterateChildren(root: TVueRoute[]) {
        for (const entry of root) {
            if (entry.component) {
                components[entry.component] = components[entry.component] || `router_page_$${ i++ }`
            }
            if (entry.children) {
                iterateChildren(entry.children)
            }
        }
    }
    return components
}

export function getVueRenderedRoutes(vueRoutes: TVueRoute[], moduleId: string, viteDev = false) {
    const _routes = JSON.parse(JSON.stringify(vueRoutes)) as TVueRoute[]
    const map = getVueRoutesMap(vueRoutes)
    iterateChildren(_routes)
    function iterateChildren(root: TVueRoute[]) {
        for (const entry of root) {
            if (entry.component && !entry.component.startsWith('async () => ')) {
                entry.component = `async () => (await import('${ viteDev ? '/feroom-virtual-index.js' : moduleId }')).${ map[entry.component] }`
            }
            if (entry.children) {
                iterateChildren(entry.children)
            }
        }
    }
    return _routes
}
