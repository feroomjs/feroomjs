import { WooksConnect } from '@wooksjs/connect-adapter'
import { createServer, ViteDevServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import { FeRoomConfigFile, pkg } from '@feroomjs/tools'
import connect from 'connect'
import { FeRegistry, FeRoom } from '@feroomjs/server'
import { WooksHttp } from '@wooksjs/event-http'
import { MoostHttp } from '@moostjs/event-http'
import { virtualIndexName } from 'common'
import Inspect from 'vite-plugin-inspect'
import { feroomForVitePlugin } from '@feroomjs/tools'

const DEFAULT_PORT = 3157

export async function createDevServer(feConf: FeRoomConfigFile) {
    const connectApp = connect()
    let running = false

    const wooksApp = new WooksConnect(connectApp)
    const { feroom, reRegister } = await runFeRoomServer(feConf, wooksApp)

    let server: ViteDevServer

    async function restart(newConfig: FeRoomConfigFile) {
        if (running) {
            await wooksApp.close()
            await server.close()
            connectApp.stack.splice(1, connectApp.stack.length)
        }
        const configData = await feConf.get()
        const buildHelpers = await feConf.getBuildHelpers()
        const port = configData.devServer?.port || DEFAULT_PORT

        const alias = {
            ...buildHelpers.paths,
            // ...obj,
        }

        server = await createServer({
            configFile: false,
            root: process.cwd(),
            server: {
                // base: '__vite_dev__',
                port,
                middlewareMode: true,
            },
            resolve: {
                alias,
            },
            plugins: [
                vue(),
                feroomForVitePlugin({
                    devMode: { feroom },
                    configData,
                }),
                Inspect(),
            ],
            optimizeDeps: {
    
                entries: [virtualIndexName],
                esbuildOptions: {
                    alias,
                },
                exclude: [
                    ...buildHelpers.external,
                ],
            },
            // appType: 'custom',
        })

        connectApp.use(server.middlewares)
        await wooksApp.listen(port)

        await reRegister(newConfig)
        running = true
    }

    await restart(feConf)

    return {
        wooksApp,
        feroom,
        restart,
    }
}

async function runFeRoomServer(config: FeRoomConfigFile, wooksApp: WooksHttp) {
    const configData = await config.get()

    const ext = configData.devServer?.ext || []

    const reg = new FeRegistry()
    const server = new FeRoom({
        head: '<script type="module" src="/@vite/client"></script>',
    }, reg)

    await reRegister(config)

    for (const extItem of ext) {
        void server.ext(extItem)
    }

    void server.adapter(new MoostHttp(wooksApp))
    await server.init()

    async function reRegister(config: FeRoomConfigFile) {
        const renderedConfig = JSON.stringify(await config.render(true))
        return reg.registerModule({
            activate: true,
            files: { 'package.json': JSON.stringify(pkg), 'feroom.config.json': renderedConfig },
            entry: virtualIndexName, // configData.buildOptions?.input,
            source: 'vite',
            id: configData.registerOptions?.id,
        })
    }

    return {
        reRegister,
        feroom: server,
    }
}
