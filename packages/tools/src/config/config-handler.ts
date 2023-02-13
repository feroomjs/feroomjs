import { TFeRoomConfig } from 'common'
import { dirname, join } from 'path'
import { getLockVersion, pkg } from '../utils'
import * as exts from './config-ext'

export class FeRoomConfigHandler {
    constructor(private data: TFeRoomConfig, public readonly devMode = false) {}

    protected rendered?: TFeRoomConfig

    protected buildHelpers: {
        bundle: string[]
        paths: Record<string, string>
        target: string
        outDir: string
        fileName: string
        ext: string
        lockVersions: string[]
        external: string[]
        externalNoLock: string[]
    } | undefined

    get(): TFeRoomConfig {
        return this.data
    }

    getBuildHelpers() {
        if (!this.buildHelpers) {
            const configData = this.data
            const buildOptions = configData.buildOptions || {}
            
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
    
            const target = configData.buildOptions?.output || './dist/index.mjs'
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

            this.buildHelpers = {
                // list of deps to bundle in
                bundle,
    
                // list of deps to lock version { 'depName': 'depName@version' }
                paths,
    
                // dist path (file)
                target,
    
                // dist dir
                outDir,
    
                // dist file name
                fileName,
    
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

    renderConfig(): TFeRoomConfig {
        if (!this.rendered) {
            let data = JSON.parse(JSON.stringify(this.data)) as TFeRoomConfig
            for (const ext of this.exts.filter(ext => typeof ext.transformConfig === 'function')) {
                data = (ext as Required<TFeConfigExt>).transformConfig(data, this)
            }
            this.rendered = {
                registerOptions: {
                    ...(data.registerOptions || {}),
                },
                extensions: {
                    ...(data.extensions || {}),
                },
            }
        }
        return this.rendered
    }

    renderVirtualIndex() {
        const buildOptions = this.data.buildOptions || {}
        let content = ''
        for (const ext of this.exts.filter(ext => typeof ext.prependVirtualIndex === 'function')) {
            content += (ext as Required<TFeConfigExt>).prependVirtualIndex(this)
        }
        if (buildOptions.input) {
            content += `export * from '${ this.devMode
                ? buildOptions.input.replace(/^\./, '')
                : buildOptions.input.replace(/\.ts$/, '') }';\n`
        }
        if (!this.devMode && buildOptions.css) {
            const cssOpts = buildOptions.css as (string | { fileName: string })
            let cssPath
            if (typeof cssOpts === 'string') {
                cssPath = cssOpts
            } else if (cssOpts.fileName) {
                cssPath = cssOpts.fileName
            }
            if (cssPath) {
                cssPath = join(dirname(buildOptions.output || ''), cssPath)
                content += `__loadCss(window.__feroom.modulesPrefixPath + '${ this.data.registerOptions?.id || pkg.name }/${ cssPath }');\n`
            }
        }
        // content += getVueRoutesExports(conf.extensions?.vueRoutes as TVueRoute[] || [], this.devMode)
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
}
