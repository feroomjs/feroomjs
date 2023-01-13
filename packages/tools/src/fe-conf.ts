
import { writeFileSync, mkdirSync } from 'node:fs'
import { TFeRoomConfig } from 'common'
import { buildPath, pkg } from './utils'
import { getVueRenderedRoutes, getVueRoutes } from './vue-routes'
import { dirname } from 'node:path'

const { readFileSync, existsSync } = require('node:fs')

let cached: TFeRoomConfig

export function getFeConf(path?: string | TFeRoomConfig): TFeRoomConfig {
    if (path && typeof path === 'string') {
        const isJs = path.endsWith('.js')
        const bPath = buildPath(path)
        if (existsSync(bPath)) {
            return isJs ? require(bPath) : JSON.parse(readFileSync(bPath).toString())
        }
        return {}
    } else if (typeof path === 'object') {
        return path
    }
    if (!cached) {
        const jsonPath = buildPath('feroom.config.json')
        const jsPath = buildPath('feroom.config.js')
    
        if (existsSync(jsonPath)) {
            cached = JSON.parse(readFileSync(jsonPath).toString())
        } else if (existsSync(jsPath)) {
            cached = require(jsPath)
        } else {
            cached = {}
        }
    }
    return cached
}

export function renderFeConf(_conf?: TFeRoomConfig, target?: string): TFeRoomConfig {
    const conf = JSON.parse(JSON.stringify(_conf || getFeConf())) as TFeRoomConfig
    conf.registerOptions = conf.registerOptions || {}
    const id = conf.registerOptions.id || pkg.name
    if (!conf.registerOptions.entry) {
        conf.registerOptions.entry = pkg.module || pkg.main
    }
    if (conf.extensions?.vueRoutes) {
        conf.extensions.vueRoutes = getVueRenderedRoutes(getVueRoutes(), id)
    }
    if (conf.buildOptions?.dependencies?.lockVersion) {
        conf.registerOptions.lockDependency = {}
        for (const dep of conf.buildOptions.dependencies.lockVersion) {
            const version = getLockVersion(dep)
            conf.registerOptions.lockDependency[dep] = version
        }
    }
    if (target) {
        const path = buildPath(target)
        mkdirSync(dirname(path), { recursive: true})
        writeFileSync(path, JSON.stringify(conf, null, '  '))
    }
    return conf
}

export function getLockVersion(dep: string) {
    return JSON.parse(readFileSync(buildPath('node_modules', dep, 'package.json')).toString()).version
}
