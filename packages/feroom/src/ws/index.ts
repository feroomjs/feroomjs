import { MoostHttp } from '@moostjs/event-http'
import { Server } from 'http'
import { Controller, Inject } from 'moost'
import WebSocket from 'ws'
import { FeRoomExtension } from '@feroomjs/server'
import { TFeRoomExtension } from '..'

const protocol = 'feroom-dev'

@FeRoomExtension('ws-ext')
@Controller()
export class WsExt implements TFeRoomExtension {
    clients: Set<WebSocket> = new Set()

    constructor(private http: MoostHttp, @Inject('feroom-dev-server-event') private event: (reloadCb: () => void) => void) {
        const server = this.http.getHttpApp().getServer() as Server
        const wss = new WebSocket.Server({ noServer: true })
        server.on('upgrade', (req, socket, head) => {
            if (req.headers['sec-websocket-protocol'] !== protocol) {
                return
            }
            wss.handleUpgrade(req, socket, head, (client) => {
                wss.emit('connection', client, req)
            })
        })
        this.event(() => {
            this.broadcastMessage({ command: 'reload' })
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

    broadcastMessage(data: { command: string }) {
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
        client.on('message', (data) => {
            //
        })
    }

    connectClient(client: WebSocket) {
        this.clients.add(client)
    }
}
