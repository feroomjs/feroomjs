
import { writeFileSync, mkdirSync } from 'node:fs'
import { TFeRoomConfig } from './types'
import { buildPath, pkg } from './utils'
import { getVueRenderedRoutes, getVueRoutes } from './vue-routes'
import { dirname } from 'node:path'

const { readFileSync, existsSync } = require('node:fs')

let cached: TFeRoomConfig

export function getFeConf() {
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

export function renderFeConf(target?: string): TFeRoomConfig {
    const conf = JSON.parse(JSON.stringify(getFeConf()))
    const id = conf.id || pkg.name
    if (!conf.entry) {
        conf.entry = pkg.module || pkg.main
    }
    if (conf.vueRoutes) {
        conf.vueRoutes = getVueRenderedRoutes(getVueRoutes(), id)
    }
    if (target) {
        const path = buildPath(target)
        mkdirSync(dirname(path), { recursive: true})
        writeFileSync(path, JSON.stringify(conf, null, '  '))
    }
    return conf
}
