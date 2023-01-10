import { FeRoomConfig } from './config'
import { FeRoomIndex } from './index-html'
import { FeRegistry } from './registry'

const config = new FeRoomConfig({
    importMap: {
        'test': 'test.js'
    },
    globals: {
        _VAR_: 'var-value',
        process: { env: { NODE_ENV: 'dev' } }
    },
    preloadCss: [
        'stand-alone.css',
        ['module2', 'style.css'],
    ],
    preloadScript: [
        'stand-alone.js',
        ['module2', 'bundle.js'],
    ],
    preloadModule: ['module'],
})

const reg = new FeRegistry()
reg.registerModule({
    id: 'module',
    version: '1',
    files: {},
    rootFile: 'index.js',
    preloadScripts: 'm1.js',
    preloadCss: ['m1-1.css', 'm1-2.css'],
})
reg.registerModule({
    id: 'module2',
    version: '1',
    files: {},
    rootFile: 'index2.js',
    preloadScripts: ['m2-1.js', 'm2-2.js'],
    preloadCss: 'm2.css',
})
reg.registerModule({
    id: 'module-root',
    version: '1',
    files: {},
    rootFile: 'root-app.js',
    preloadRoot: true,
})

const index = new FeRoomIndex(reg, config)

describe('index-html', () => {
    it('must render import map', () => {
        expect(index.getImportmap()).toBe('{"module":"./feroom-module/module/index.js","module2":"./feroom-module/module2/index2.js","test":"test.js"}')
    })

    it('must render globals', () => {
        expect(index.getGlobals()).toMatchInlineSnapshot(`
            "window["_VAR_"] = "var-value";
            window["process"] = {"env":{"NODE_ENV":"dev"}};
            "
        `)
    })

    it('must render module path', () => {
        expect(index.getModulePath('module')).toBe('feroom-module/module/index.js')
    })

    it('must render css links', () => {
        expect(index.getCss()).toMatchInlineSnapshot(`
            "<link type="text/css" rel="stylesheet" href="stand-alone.css">
            <link type="text/css" rel="stylesheet" href="feroom-module/module2/style.css">
            <link type="text/css" rel="stylesheet" href="feroom-module/module/m1-1.css">
            <link type="text/css" rel="stylesheet" href="feroom-module/module/m1-2.css">
            <link type="text/css" rel="stylesheet" href="feroom-module/module2/m2.css">"
        `)
    })

    it('must render script links', () => {
        expect(index.getScripts()).toMatchInlineSnapshot(`
            "<script type="module" src="stand-alone.js"></script>
            <script type="module" src="feroom-module/module2/bundle.js"></script>
            <script type="module" src="feroom-module/module/m1.js"></script>
            <script type="module" src="feroom-module/module2/m2-1.js"></script>
            <script type="module" src="feroom-module/module2/m2-2.js"></script>"
        `)
    })

    it('must render script links for module preload', () => {
        expect(index.getPreloadModule()).toMatchInlineSnapshot(`
            "<script type="module" src="feroom-module/module/index.js"></script>
            <script type="module" src="feroom-module/module-root/root-app.js"></script>"
        `)
    })
})
