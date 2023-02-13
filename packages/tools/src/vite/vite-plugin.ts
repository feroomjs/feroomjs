
import { Plugin } from 'vite'
import { FeRoom, FeRoomIndex } from '@feroomjs/server'
import { TFeRoomConfig, virtualIndexName } from 'common'
import { getMoostInfact } from 'moost'
import { getVirtualIndex } from '../virtual'
import { pkg } from '../utils'
import { join } from 'path'

export interface TVitePluginOpts {
    configData: TFeRoomConfig
    renderedConf?: TFeRoomConfig
    devMode?: {
        feroom: FeRoom
    },
    paths?: Record<string, string>
}

export function feroomForVitePlugin(opts: TVitePluginOpts): Plugin {
    const virtualIndexName2 = '/feroom-virtual-index.js'
    const cwd = process.cwd()
    const virtualIndexName3 = join(cwd, virtualIndexName)
    return {
        name: 'feroom:resolve-external-id',
        async resolveId(id) {
            if (opts.devMode) {
                const index = await getMoostInfact().getForInstance(opts.devMode.feroom, FeRoomIndex)
                const importmap = await index.getImportmapJson(index.getModules())
                if (importmap[id]) {
                    return { id: importmap[id] || id, external: true }
                }
            } else {
                if (id.startsWith('@feroom-ext')) return { id, external: true }
                if (opts.paths && Object.entries(opts.paths).map(p => p[1]).includes(id))  return { id, external: true }
                const isDep = Object.keys(pkg.dependencies || {}).includes(id)
                const toBundle = opts.configData.buildOptions?.dependencies?.bundle?.includes(id)
                if (isDep && !toBundle) return { id, external: true }
                if (id === virtualIndexName || id === virtualIndexName2 || id === virtualIndexName3) {
                    return id
                }
            }
        },
        load(id) {
            if (id === virtualIndexName || id === virtualIndexName2 || id === virtualIndexName3) {
                return getVirtualIndex(opts.configData, !!opts.devMode)
            }
        },
        buildEnd() {
            if (!opts.devMode && opts.renderedConf) {
                this.emitFile({
                    type: 'asset',
                    fileName: 'feroom.config.json',
                    source: JSON.stringify(opts.renderedConf),
                })
            }
        },
    }
}
