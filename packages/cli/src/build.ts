import { Cli } from '@moostjs/event-cli'
import { Controller } from 'moost'
import { rollup, RollupError }  from 'rollup'
import { buildPath, FeRoomRegister, getFeConf } from '@feroomjs/tools'
import { useFlag } from '@wooksjs/event-cli'
import { logError, panic } from 'common'
import { existsSync, unlinkSync, writeFileSync } from 'fs'
import nodeResolve from '@rollup/plugin-node-resolve'
import cjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'

const files = [
    './feroom.config.ts',
    './feroom.config.js',
    './feroom.config.json',
]

@Controller('build')
export class FeRoomCliBuild {
    @Cli('')
    async root() {
        let confRelPath = useFlag('c')
        const target = useFlag('t')
        if (!target || typeof target !== 'string') throw panic('Key -t required with the target FeRoom server.')
        if (!target.startsWith('http')) throw panic(`Target "${ target }" has wrong format. It must start with "http".`)
        if (target.search('://') < 4) throw panic(`Target "${ target }" has wrong format. Use full host string like "http://localhost:3000" etc...`)

        if (!confRelPath) {
            for (const file of files) {
                if (existsSync(buildPath(file))) {
                    confRelPath = file
                    break
                }
            }
        }
        if (!confRelPath || typeof confRelPath !== 'string') throw panic('Feroom config file is not found. Use key -c to point to the config file.')

        let confAbsPath = buildPath(confRelPath)
        const isJs = confAbsPath.endsWith('.js')
        const isTs = confAbsPath.endsWith('.ts')
        const isJson = confAbsPath.endsWith('.json')
        let toDelete = ''
        if (!isJs && !isTs && !isJson) throw panic(`Config file "${confRelPath}" has unsupported format. Please use .json, .js or .ts`)
        if (!existsSync(confAbsPath)) throw panic(`Config file "${confRelPath}" does not exist.`)
        if (!isJson) {
            const ts = isTs ? [typescript()] : []
            try {
                const bundle = await rollup({
                    input: confAbsPath,
                    plugins: [
                        ...ts,
                        nodeResolve({
                            modulePaths: [buildPath('./node_modules')],
                        }),
                        cjs(),
                    ]
                })
                confRelPath = `feroom.config-${ new Date().getTime() }.js`
                confAbsPath = buildPath(confRelPath)
                const output = await bundle.generate({
                    file: confAbsPath,
                    format: 'cjs'
                })
                writeFileSync(confAbsPath, output.output[0].code)
                toDelete = confAbsPath
            } catch(e) {
                const re = e as RollupError
                if (re.cause && re.code && re.frame) {
                    logError(re.code + '\n' + __DYE_BOLD_OFF__ + __DYE_WHITE__ + re.frame)
                } else {
                    logError((e as Error).message)
                }
                process.exit(1)
            }
        }
        let conf
        try {
            conf = getFeConf(confRelPath)
        } catch (e) {
            conf = undefined
        }
        if (toDelete && existsSync(toDelete)) {
            unlinkSync(toDelete)
        }
        if (!conf) {
            throw panic(`Could not parse feroom config file.`)
        }
        
        const fr = new FeRoomRegister({ host: target })
        await fr.register({
            activate: true,
            conf,
        })
        
        return '✔ done'
    }
}

// const tsConf = (filePath: string): RollupTypescriptOptions => ({
//     compilerOptions: {
//         baseUrl: ".",
//         outDir: "dist",
//         moduleResolution: "node",
//         esModuleInterop: true,
//         target: "es2015", 
//         module: "ESNext",
//         types: [ "node" ],
//         lib: [
//             "ESNext",
//             "DOM",
//             "DOM.Iterable"
//         ],
//         noUnusedLocals: false,
//         declaration: false,
//         resolveJsonModule: true,
//         downlevelIteration: true,
//         forceConsistentCasingInFileNames: true,
//         strict: false,
//         noImplicitAny: false,
//         skipLibCheck: true,
//         emitDecoratorMetadata: false,
//         experimentalDecorators: false,
//         removeComments: true
//     },
//     include: [filePath]
// })
