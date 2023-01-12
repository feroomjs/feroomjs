import { getVueRoutes, getVueRoutesExports } from "./vue-routes"

export function getVirtualIndex(input: string, confPath?: string) {
    let content = ''
    if (input) {
        content += `export * from '${ input }';\n`
    }
    content += getVueRoutesExports(getVueRoutes(confPath))
    console.log(content)
    return content
}
