import { rollup, RollupError }  from 'rollup'
import nodeResolve from '@rollup/plugin-node-resolve'
import cjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { buildPath, unbuildPath } from '../utils'
import { panic, TFeRoomConfig } from 'common'
import { logger } from '../logger'

export async function readFeRoomConfigFile(files: string[]): Promise<TFeRoomConfig> {
    let filePath: string = ''
    let builtFilePath = ''

    logger.step('Looking for FeRoom config file...')

    for (const file of files) {
        filePath = buildPath(file)
        if (existsSync(filePath)) {
            break
        } else {
            filePath = ''
        }
    }

    if (!filePath) {
        throw panic('Feroom config file was not found.')
    }
    
    logger.step('Importing FeRoom config file from ' + filePath)
    
    const isJs = filePath.endsWith('.js')
    const isTs = filePath.endsWith('.ts')
    const isJson = filePath.endsWith('.json')  
    if (!isJs && !isTs && !isJson) throw panic(`Config file "${unbuildPath(filePath)}" has unsupported format. Please use .json, .js or .ts`)  

    if (isJson) {
        return JSON.parse(readFileSync(filePath).toString()) as TFeRoomConfig
    }

    const ts = isTs ? [typescript()] : []
    try {
        const bundle = await rollup({
            input: filePath,
            plugins: [
                ...ts,
                nodeResolve({
                    modulePaths: [buildPath('./node_modules')],
                }),
                cjs(),
            ]
        })
        filePath = buildPath(`feroom.config-${ new Date().getTime() }.js`)
        const output = await bundle.generate({
            file: unbuildPath(filePath),
            format: 'cjs'
        })
        writeFileSync(filePath, output.output[0].code)
        builtFilePath = filePath
    } catch(e) {
        const re = e as RollupError
        let message
        if (re.cause && re.code && re.frame) {
            message = re.code + '\n' + __DYE_BOLD_OFF__ + __DYE_WHITE__ + re.frame
        } else {
            message = (e as Error).message
        }
        throw panic(message)
    }

    const data = require(builtFilePath) as TFeRoomConfig
    
    if (builtFilePath && existsSync(builtFilePath)) {
        unlinkSync(builtFilePath)
    }

    return data
}
