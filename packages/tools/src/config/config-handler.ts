import { TFeRoomConfig } from 'common'
import { dirname, join } from 'path'
import { getLockVersion, pkg } from '../utils'
import * as exts from './config-ext'

interface TBuildHelpers {
    bundle: string[]
    moduleId: string
    define: Record<string, unknown>
    paths: Record<string, string>
    preloadCss: string
    target: string
    outDir: string
    fileName: string
    entries: Record<string, string>
    ext: string
    lockVersions: string[]
    external: string[]
    externalNoLock: string[]
}

export class FeRoomConfigHandler {
    constructor(private data: TFeRoomConfig, public readonly devMode = false) {}

    protected rendered?: TFeRoomConfig

    protected buildHelpers?: TBuildHelpers

    get(): TFeRoomConfig {
        return this.data
    }

    getBuildHelpers(): TBuildHelpers {
        if (!this.buildHelpers) {
            const configData = this.data
            const buildOptions = configData.build || {}
            
            // list of deps to bundle in
            const bundle = buildOptions?.dependencies?.bundle ? [buildOptions?.dependencies?.bundle].flat(1) : []   
    
            // list of deps to lock version { 'depName': 'depName@version' }
            const paths: Record<string, string> = {}
            const versionedExternals: string[] = []
            if (buildOptions.dependencies?.lockVersion) {
                for (const dep of buildOptions.dependencies.lockVersion) {
                    const version = getLockVersion(dep)
                    paths[dep] = `${ dep }@${ version }`
                    versionedExternals.push(`${ dep }@${ version }`)
                }
            }
    
            // list of deps to lock version
            const lockVersions = Object.keys(paths)
    
            const target = configData.build?.output || './dist/index.mjs'
            const outDir = dirname(target)
            const fileName = target.replace(outDir + '/', '').replace(/\.\w+$/, '')
            const ext = (/\.\w+$/.exec(target) || [''])[0]
    
            const external = [
                // extrnalising dependencies
                ...Object.keys(pkg.dependencies || {}).filter(dep => !bundle.includes(dep)),
                ...Object.keys(pkg.peerDependencies || {}).filter(dep => !bundle.includes(dep)),
    
                // externalising from buildOptions.dependencies.lockVersion
                ...Object.entries(paths).map(p => p[1]),
                ...versionedExternals,
            ]

            const entries: Record<string, string> = {}

            for (const ext of this.exts.filter(ext => typeof ext.appendEntries === 'function')) {
                const newEntries = (ext as Required<TFeConfigExt>).appendEntries(this.data)
                Object.assign(entries, newEntries)
            }

            const moduleId = this.data.register?.id || pkg?.name

            let preloadCss = ''
            if (!this.devMode && this.data.build?.preloadCss) {
                preloadCss = join(outDir, 'style.css')
            }

            this.buildHelpers = {
                // list of deps to bundle in
                bundle,

                // module indentificator
                moduleId,
                
                // Define global variable replacements.
                // Entries will be defined on `window` during dev and replaced during build
                define: {
                    __MODULE_ID__: moduleId,
                    __MODULE_VERSION__: pkg?.version,
                    __DEV__: String(!!this.devMode),
                    __PROD__: String(!this.devMode),
                },
    
                // list of deps to lock version { 'depName': 'depName@version' }
                paths,

                // auto-preload css when loading js
                preloadCss,
    
                // dist path (file)
                target,
    
                // dist dir
                outDir,
    
                // dist file name
                fileName,

                // entries
                entries,
    
                // file extension 
                ext,
    
                // list of deps to lock version
                lockVersions,
    
                // external deps
                external,
    
                // external deps without locked versions (need to alias with version and exclude afterwards)
                externalNoLock: external.filter(d => !lockVersions.includes(d)),
            }
        }

        return this.buildHelpers
    }

    outPath(path: string) {
        return join(this.getBuildHelpers().outDir, path)
    }

    renderConfig(): TFeRoomConfig {
        if (!this.rendered) {
            let data = JSON.parse(JSON.stringify(this.data)) as TFeRoomConfig
            for (const ext of this.exts.filter(ext => typeof ext.transformConfig === 'function')) {
                data = (ext as Required<TFeConfigExt>).transformConfig(data, this)
            }
            this.rendered = {
                register: {
                    ...(data.register || {}),
                },
                extensions: {
                    ...(data.extensions || {}),
                },
            }
        }
        return this.rendered
    }

    renderVirtualIndex() {
        const build = this.data.build || {}
        const { preloadCss } = this.getBuildHelpers()
        let content = ''
        for (const ext of this.exts.filter(ext => typeof ext.prependVirtualIndex === 'function')) {
            content += (ext as Required<TFeConfigExt>).prependVirtualIndex(this)
        }
        if (preloadCss) {
            const indexCss = [this.data.register?.indexHtml?.preloadCss || []].flat()
            if (!indexCss || !indexCss.map(p => p.replace(/[^a-zA-Z0-9]/g, '')).includes(preloadCss.replace(/[^a-zA-Z0-9]/g, ''))) {
                content += 'import * as feUtils from \'@feroom-ext/feroom-utils\';\n'
                content += `feUtils.preloadCss(${ 
                    JSON.stringify(this.data.register?.id || pkg.name)
                }, ${
                    JSON.stringify(preloadCss)
                }, ${
                    JSON.stringify(pkg.version)
                });\n`
            }
        }
        if (build.input) {
            content += `export * from '${ this.devMode
                ? build.input.replace(/^\./, '')
                : build.input.replace(/\.ts$/, '') }';\n`
        }
        for (const ext of this.exts.filter(ext => typeof ext.appendVirtualIndex === 'function')) {
            content += (ext as Required<TFeConfigExt>).appendVirtualIndex(this)
        }
        for (const ext of this.exts.filter(ext => typeof ext.transformVirtualIndex === 'function')) {
            content = (ext as Required<TFeConfigExt>).transformVirtualIndex(content, this)
        }
        return content
    }

    private exts: TFeConfigExt[] = Object.entries(exts).map(e => e[1])

    ext(extObject: TFeConfigExt) {
        this.exts.push(extObject)
    }
}

export interface TFeConfigExt {
    appendVirtualIndex?: (c: FeRoomConfigHandler) => string
    transformVirtualIndex?: (code: string, c: FeRoomConfigHandler) => string
    prependVirtualIndex?: (c: FeRoomConfigHandler) => string
    transformConfig?: (config: TFeRoomConfig, c: FeRoomConfigHandler) => TFeRoomConfig
    appendEntries?: (config: TFeRoomConfig) => Record<string, string>
}
