
import { Plugin } from 'vite'
import { FeRoom, FeRoomIndex } from '@feroomjs/server'
import { virtualIndexName } from 'common'
import { getMoostInfact } from 'moost'
import { pkg } from '../utils'
import { join } from 'path'
import { FeRoomConfigHandler } from '../config'

export interface TVitePluginOpts {
    configHandler: FeRoomConfigHandler
    devMode?: {
        feroom: FeRoom
    },
    paths?: Record<string, string>
}

export function escapeRegex(s: string): string {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}

export function feroomForVitePlugin(opts: TVitePluginOpts): Plugin {
    const virtualIndexName2 = '/feroom-virtual-index.js'
    const cwd = process.cwd()
    const virtualIndexName3 = join(cwd, virtualIndexName)
    const configHandler = opts.configHandler
    const devMode = !!opts.configHandler.devMode

    const defineEntries = Object
        .entries(opts.configHandler.getBuildHelpers().define)
        .map(a => ([new RegExp(escapeRegex(a[0]), 'g'), typeof a[1] === 'string' ? a[1] : JSON.stringify(a[1]) ])) as unknown as ([RegExp, string][])
    const ignoreReplace = join(cwd, 'node_modules')
    
    function replace(code: string) {
        for (const [key, val] of defineEntries) {
            code = code.replace(key, val)
        }
        return code 
    }    

    return {
        name: 'feroom:vite',
        transform(code, id) {
            if (!devMode) return
            if (!id.startsWith(ignoreReplace) && id.startsWith(cwd)) {
                return replace(code)
            }   
        },
        async resolveId(id) {
            if (opts.devMode) {
                const index = await getMoostInfact().getForInstance(opts.devMode.feroom, FeRoomIndex)
                const importmap = await index.getImportmapJson(index.getModules())
                if (importmap[id]) {
                    // Vite resolves external virtual modules to "/@id/<module-id>"
                    // which brakes the module resolution in browser
                    // As a workaround we resolve all modules served by FeRoom
                    // to the exact URL from FeRoomIndex avoiding vite's "/@id/..."
                    return { id: importmap[id] || id, external: true }
                }
            } else {
                if (id.startsWith('@feroom-ext')) return { id, external: true }
                if (opts.paths && Object.entries(opts.paths).map(p => p[1]).includes(id))  return { id, external: true }
                const isDep = Object.keys(pkg.dependencies || {}).includes(id)
                const toBundle = configHandler.get().build?.dependencies?.bundle?.includes(id)
                if (isDep && !toBundle) return { id, external: true }
                if (id === virtualIndexName || id === virtualIndexName2 || id === virtualIndexName3) {
                    return id
                }
            }
        },
        load(id) {
            if (id === virtualIndexName || id === virtualIndexName2 || id === virtualIndexName3) {
                return devMode ? replace(configHandler.renderVirtualIndex()) : configHandler.renderVirtualIndex()
            }
        },
        buildEnd() {
            if (!devMode) {
                this.emitFile({
                    type: 'asset',
                    fileName: 'feroom.config.json',
                    source: JSON.stringify(configHandler.renderConfig()),
                })
            }
        },
    }
}
