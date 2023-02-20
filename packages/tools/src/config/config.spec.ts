/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/ban-ts-comment */
jest.mock('fs')
jest.mock('../utils', () => ({
    ...jest.requireActual('../utils'),
    getLockVersion: jest.fn(),
}))
import { existsSync, readFileSync } from 'fs'
import { FeRoomConfigReader } from '.'
import { getLockVersion } from '../utils'

const mGetLockVersion = getLockVersion as unknown as jest.Mock<typeof getLockVersion>
const mExistsSync = existsSync as unknown as jest.Mock<typeof existsSync>
const mReadFileSync = readFileSync as unknown as jest.Mock<typeof readFileSync>

function mockFile(path: string, content: string) {
    // @ts-ignore
    mExistsSync.mockImplementation(p => {
        console.log('mExistsSync', p)
        return p && p.endsWith(path)
    })
    // @ts-ignore
    mReadFileSync.mockImplementation(() => Buffer.from(content))
}

// @ts-ignore
mGetLockVersion.mockReturnValue('0.0.2')

const initialConfig = {
    buildOptions: {
        input: 'my-index.js',
        css: 'my-styles.css',
        dependencies: {
            lockVersion: ['@my-module/m1'],
        },
    },
    registerOptions: {
        id: '@my-module/m0',
        importNpmDependencies: {
            '@my-module/m1': {},
        },
    },
    extensions: {
        vueRoutes: [
            {
                path: '/route1',
                children: [
                    { name: 'route:index', path: '', component: './src/pages/Index.vue' },
                    { name: 'route:index', path: 'index', component: './src/pages/Index.vue' },
                    { name: 'route:details', path: 'details/:id', component: './src/pages/Details.vue', props: true },
                ],
            },
        ],
    },
}

const renderedConfig = {
    buildOptions: {
        input: 'my-index.js',
        css: 'my-styles.css',
        dependencies: {
            lockVersion: [
                '@my-module/m1',
            ],
        },
    },
    registerOptions: {
        id: '@my-module/m0',
        entry: 'index.js',
        importNpmDependencies: {
            '@my-module/m1': {
                version: '0.0.2',
            },
        },
        lockDependency: {
            '@my-module/m1': '0.0.2',
        },
    },
    extensions: {
        vueRoutes: [
            {
                path: '/route1',
                children: [
                    { name: 'route:index', path: '', component: 'async () => (await import(\'@my-module/m0\')).router_page_$0' },
                    { name: 'route:index', path: 'index', component: 'async () => (await import(\'@my-module/m0\')).router_page_$0' },
                    { name: 'route:details', path: 'details/:id', component: 'async () => (await import(\'@my-module/m0\')).router_page_$1', props: true },
                ],
            },
        ],
    },
}

describe('FeRoomConfigFile', () => {
    it('must parse feroom.config.json file', async () => {
        mockFile('feroom.config.json', '{"mocked":true}')
        expect(await new FeRoomConfigReader().getData()).toEqual({ mocked: true })
    })
    it('must parse feroom.config.js file', async () => {
        expect((await new FeRoomConfigReader(initialConfig).getHandler()).renderConfig()).toEqual(renderedConfig)
    })
})

describe('virtual', () => {
    it('must render virtual index', async () => {
        const handler = (await new FeRoomConfigReader(initialConfig).getHandler())
        expect(handler.renderVirtualIndex()).toMatchInlineSnapshot(`
"export * from 'my-index.js';
export { default as router_page_$0 } from './src/pages/Index.vue';
export { default as router_page_$1 } from './src/pages/Details.vue';
"
`)
    })
})

