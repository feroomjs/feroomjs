import { Server } from 'http'
import { Controller } from 'moost'
import WebSocket from 'ws'
import { FeRegistry, FeRoomExtension } from '@feroomjs/server'
import { TFeRoomExtension, TModuleData } from '..'

const protocol = 'feroom-dev'

@FeRoomExtension('ws-ext')
@Controller()
export class WsExt implements TFeRoomExtension {
    clients: Set<WebSocket> = new Set()

    constructor(
        server: Server,
        reg: FeRegistry,
    ) {
        const wss = new WebSocket.Server({ noServer: true })
        server.on('upgrade', (req, socket, head) => {
            if (req.headers['sec-websocket-protocol'] !== protocol) {
                return
            }
            wss.handleUpgrade(req, socket, head, (client) => {
                wss.emit('connection', client, req)
            })
        })
        reg.on('register-module', (module: TModuleData) => {
            this.broadcastMessage({ command: 'reload', module: module.id, version: module.version })
        })
        wss.on('connection', (client) => {
            this.connectClient(client)
            this.registerListener(client)
        })
    }

    injectIndexBody(): string {
        return `<script>
        const socketURL = (location.protocol === "http:" ? "ws://" : "wss://") + location.host + "/";    
        const socket = new WebSocket(socketURL, "${ protocol }");
        socket.addEventListener("message", (data) => {
            console.log('${__DYE_YELLOW__ + __DYE_BOLD__}Got message: reloading...${__DYE_RESET__}', data)
            window.location.reload()
        })
</script>
        `
    }

    broadcastMessage(data: { command: string, module: string, version: string }) {
        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data))
            } else {
                this.disconnectClient(client)
            }
        })
    }

    disconnectClient(client: WebSocket) {
        client.terminate()
        this.clients.delete(client)
    }

    disconnectAllClients() {
        for (const client of this.clients) {
            this.disconnectClient(client)
        }
    }

    registerListener(client: WebSocket) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        client.on('message', (data) => {
            //
        })
    }

    connectClient(client: WebSocket) {
        this.clients.add(client)
    }
}
