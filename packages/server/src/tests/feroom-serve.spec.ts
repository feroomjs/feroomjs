import { WooksHttp, createHttpContext, useSetHeader } from '@wooksjs/event-http'
import { IncomingMessage, ServerResponse } from 'http'
import { Socket } from 'net'
import { FeRoomConfig } from '../config'
import { FeRoomServe } from '../feroom-serve'
import { FeRegistry } from '../registry'

const wHttp = new WooksHttp()
const reg = new FeRegistry()
const config = new FeRoomConfig({})
const serve = new FeRoomServe(reg, wHttp, config)

reg.registerModule({
    id: 'module',
    version: '1',
    files: {
        'index.js': 'module v1 index.js content',
    },
    activate: true,
    config: {
        register: {
            entry: 'index.js',
        },
    },
})
reg.registerModule({
    id: 'module',
    version: '2',
    files: {
        'index.js': 'module v2 index.js content',
    },
    activate: false,
    config: {
        register: {
            entry: 'index.js',
        },
    },
})
reg.registerModule({
    id: 'module2',
    version: '2',
    files: {
        'index2.js': 'module2 index.js content',
    },
    config: {
        register: {
            entry: 'index2.js',
            dependencies: {
                lock: {
                    'module': '1',
                },
            },
        },
    },
})

const req = new IncomingMessage(new Socket)
const res = new ServerResponse(req)

createHttpContext({
    req,
    res,
})

describe('feroom serve', () => {
    it('must serve file from module', () => {
        const location = useSetHeader('location')
        expect(serve.serveModule('module')).toBe('')
        expect(location.value).toBe('/feroom-module/module@1/index.js')
        expect(serve.serveModule('module', '', 'index.js')).toBe('module v1 index.js content')
        expect(serve.serveModule('module', '2', '')).toBe('')
        expect(location.value).toBe('/feroom-module/module@2/index.js')
        expect(serve.serveModule('module', '1', 'index.js')).toBe('module v1 index.js content')
        expect(serve.serveModule('module2', '', 'index2.js')).toBe('module2 index.js content')
    })
})
