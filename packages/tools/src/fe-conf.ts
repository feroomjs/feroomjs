
import { TFeRoomConfig } from "./types"
import { buildPath } from "./utils"

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
