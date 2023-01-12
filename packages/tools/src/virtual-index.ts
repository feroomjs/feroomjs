import { getVueRoutes, getVueRoutesExports } from "./vue-routes"

export function getVirtualIndex(input: string) {
    let content = ''
    if (input) {
        content += `export * from '${ input }';\n`
    }
    content += getVueRoutesExports(getVueRoutes())
    console.log(content)
    return content
}
