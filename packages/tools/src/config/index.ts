/* eslint-disable @typescript-eslint/no-misused-promises */
import { panic, TFeRoomConfig } from 'common'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { logger } from '../logger'
import { buildPath, getLockVersion, pkg, unbuildPath } from '../utils'
import { getVueRenderedRoutes } from './vue-routes'
import * as esbuild from 'esbuild'
import { esbuildWatchPlugin } from '../esbuild/plugins/watch-cb-plugin'
import { dirname } from 'path'

export class FeRoomConfigFile {
    protected files: string[] = [
        './feroom/config.ts',
        './feroom/config.js',
        './feroom.config.ts',
        './feroom.config.js',
        './feroom.config.json',
    ]

    protected data?: TFeRoomConfig

    protected rendered?: TFeRoomConfig

    protected listeners: ((cfg: TFeRoomConfig) => void | Promise<void>)[] = []

    constructor(path?: string | TFeRoomConfig, protected watch = false) {
        if (typeof path === 'string') {
            this.files = [ path ]
        } else if (typeof path === 'object') {
            if (watch) {
                throw new Error('Can not instantiate FeRoomConfigFile in watch mode when pre-rendered config passed as an argument.')
            }
            this.data = path
        }
    }

    async get(): Promise<TFeRoomConfig> {
        if (!this.data) {
            this.data = await this.readConfig() // await readFeRoomConfigFile(this.files)
        }
        return this.data
    }

    onChange(cb: (cfg: TFeRoomConfig) => void | Promise<void>) {
        this.listeners.push(cb)
    }

    protected readConfig() {
        let filePath: string = ''

        logger.step('Looking for FeRoom config file...')

        for (const file of this.files) {
            filePath = buildPath(file)
            if (existsSync(filePath)) {
                break
            } else {
                filePath = ''
            }
        }
        if (!filePath) {
            throw new Error('Feroom config file was not found. ' + this.files.join(', '))
        }
        logger.step('Importing FeRoom config file from ' + filePath)
    
        const isJs = filePath.endsWith('.js')
        const isTs = filePath.endsWith('.ts')
        const isJson = filePath.endsWith('.json')  
        if (!isJs && !isTs && !isJson) throw new Error(`Config file "${unbuildPath(filePath)}" has unsupported format. Please use .json, .js or .ts`)          
        
        if (isJson) {
            return JSON.parse(readFileSync(filePath).toString()) as TFeRoomConfig
        }

        return this.buildConfig(filePath)
    }

    protected async buildConfig(filePath: string) {
        logger.step('Building FeRoom config...')
        
        const escfg: esbuild.BuildOptions = {
            entryPoints: [filePath],
            bundle: true,
            packages: 'external',
            format: 'esm',
            platform: 'node',
            write: false,
            outfile: 'feroom.config.js',
            plugins: [],
        }
        if (this.watch) {
            return new Promise<TFeRoomConfig>(async (resolve) => {
                escfg.plugins?.push(esbuildWatchPlugin(async (bld: esbuild.BuildResult) => {
                    if (bld.outputFiles && bld.outputFiles[0]) {
                        const data = await this.loadJsConf(bld.outputFiles[0].text)
                        resolve(data)
                        this.fireChange(data)
                    } else {
                        throw new Error('Failed to build FeRoom config :(')
                    }
                }))
                const ctx = await esbuild.context(escfg)
                await ctx.watch()
            })
        } else {
            const bld = await esbuild.build(escfg)
            if (bld.outputFiles && bld.outputFiles[0]) {
                return this.loadJsConf(bld.outputFiles[0].text)
            }
            throw new Error('Failed to build FeRoom config :(')
        }
    }

    protected async loadJsConf(content: string): Promise<TFeRoomConfig> {
        const filePath = buildPath(`feroom.config-${ new Date().getTime() }.mjs`)
        writeFileSync(filePath, content)
        try {
            const data = ((await import(filePath)) as { default: TFeRoomConfig}).default //(require(filePath) as { default: TFeRoomConfig}).default
            unlinkSync(filePath)
            return data
        } catch (e) {
            unlinkSync(filePath)
            throw e
        }
    }

    protected fireChange(newConfig: TFeRoomConfig) {
        this.data = newConfig
        this.rendered = undefined
        this.listeners.forEach(cb => void cb(newConfig))
    }

    async getBuildHelpers() {
        const configData = await this.get()
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

        return {
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

    async render(viteDev = false): Promise<TFeRoomConfig> {
        if (!this.rendered) {
            const data = JSON.parse(JSON.stringify(await this.get())) as TFeRoomConfig
            data.registerOptions = data.registerOptions || {}
            const id = data.registerOptions.id || pkg?.name
            if (!id) throw panic('Could not resolve module id. Please use option "registerOptions.id".')
            if (!data.registerOptions.entry) {
                data.registerOptions.entry = pkg?.module || pkg?.main
            }
            if (data.extensions?.vueRoutes) {
                data.extensions.vueRoutes = getVueRenderedRoutes(data.extensions.vueRoutes, id, viteDev)
            }
            if (data.buildOptions?.dependencies?.lockVersion) {
                data.registerOptions.lockDependency = {}
                for (const dep of data.buildOptions.dependencies.lockVersion) {
                    const version = getLockVersion(dep)
                    data.registerOptions.lockDependency[dep] = version
                    if (data.registerOptions?.importNpmDependencies && data.registerOptions?.importNpmDependencies[dep]) {
                        const npmDep = data.registerOptions.importNpmDependencies[dep]
                        if (npmDep.version && npmDep.version !== version) {
                            logger.warn(`registerOptions.importNpmDependencies["${dep}"] has different version from what's installed in node_modules. Changing version to ${ version }.`)
                        }
                        npmDep.version = version
                    }
                }
            }
            if (data.buildOptions?.dependencies?.bundle && data.registerOptions?.importNpmDependencies) {
                for (const dep of data.buildOptions.dependencies.bundle) {
                    const npmDep = data.registerOptions.importNpmDependencies[dep]
                    if (npmDep) {
                        logger.warn(`When bundling "${ dep }" it must be wrong to pass importNpmDependencies["${dep}"] as there should not be such external dependency.`)
                    }
                }
            }
            if (data.buildOptions?.dependencies?.bundle && data.buildOptions?.dependencies?.lockVersion) {
                for (const dep of data.buildOptions.dependencies.bundle) {
                    if (data.buildOptions.dependencies.lockVersion.includes(dep)) {
                        logger.warn(`Dependency "${ dep }" set for locking version and for bundling in. Only one of the options make sense.`)
                    }
                }
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
}
