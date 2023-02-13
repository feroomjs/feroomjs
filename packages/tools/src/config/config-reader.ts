/* eslint-disable @typescript-eslint/no-misused-promises */
import { TFeRoomConfig } from 'common'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { logger } from '../logger'
import { buildPath, unbuildPath } from '../utils'
import * as esbuild from 'esbuild'
import { esbuildWatchPlugin } from '../esbuild/plugins/watch-cb-plugin'
import { FeRoomConfigHandler } from './config-handler'

export class FeRoomConfigReader {
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

    async getData(): Promise<TFeRoomConfig> {
        if (!this.data) {
            this.data = await this.readConfig() // await readFeRoomConfigFile(this.files)
        }
        return this.data
    }

    async getHandler(devMode = false) {
        return new FeRoomConfigHandler(await this.getData(), devMode)
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
}
