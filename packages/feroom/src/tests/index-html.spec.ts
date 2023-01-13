import { FeRoomConfig } from '../config'
import { FeRoomIndex } from '../index-html'
import { FeRegistry } from '../registry'

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
    config: {
        registerOptions: {
        entry: 'index.js',
            preloadScripts: 'm1.js',
            preloadCss: ['m1-1.css', 'm1-2.css'],
        }
    }
})
reg.registerModule({
    id: 'module2',
    version: '1',
    files: {},
    config: {
        registerOptions: {
        entry: 'index2.js',
            preloadScripts: ['m2-1.js', 'm2-2.js'],
            preloadCss: 'm2.css',
        }
    }
})
reg.registerModule({
    id: 'module-root',
    version: '1',
    files: {},
    config: {
        registerOptions: {
            lockDependency: {
                'module2': '1',
            },
            entry: 'root-app.js',
            preloadRoot: true,
        }
    }
})

const index = new FeRoomIndex(reg, config)

describe('index-html', () => {
    
    const modules = index.getModules()
    
    it('must render import map', async () => {
        jest.setTimeout(20000);
        await reg.registerFromNpm({ name: 'vue' })
        const modules = index.getModules()
        expect(index.getImportmap(modules)).toMatchInlineSnapshot(`
"{
  "module": "/feroom-module/module/index.js",
  "module2": "/feroom-module/module2/index2.js",
  "module-root": "/feroom-module/module-root/root-app.js",
  "module2@1": "/feroom-module/module2@1/index2.js",
  "vue": "/feroom-module/vue/dist/vue.runtime.esm-bundler.js",
  "test": "test.js"
}"
`)
    })

    it('must render globals', () => {
        expect(index.getGlobals(modules)).toMatchInlineSnapshot(`
            "window["_VAR_"] = "var-value";
            window["process"] = {"env":{"NODE_ENV":"dev"}};
            "
        `)
    })

    it('must render css links', () => {
        expect(index.getCss(modules)).toMatchInlineSnapshot(`
"<link type="text/css" rel="stylesheet" href="stand-alone.css">
<link type="text/css" rel="stylesheet" href="feroom-module/module2/style.css">
<link type="text/css" rel="stylesheet" href="feroom-module/module/m1-1.css">
<link type="text/css" rel="stylesheet" href="feroom-module/module/m1-2.css">
<link type="text/css" rel="stylesheet" href="feroom-module/module2/m2.css">

"
`)
    })

    it('must render preload script links', () => {
        expect(index.getScripts(modules)).toMatchInlineSnapshot(`
"<script type="module" src="stand-alone.js"></script>
<script type="module" src="feroom-module/module2/bundle.js"></script>
<script type="module" src="feroom-module/module/m1.js"></script>
<script type="module" src="feroom-module/module2/m2-1.js"></script>
<script type="module" src="feroom-module/module2/m2-2.js"></script>

"
`)
    })

    it('must render script links for module preload', () => {
        expect(index.getPreloadModule(modules)).toMatchInlineSnapshot(`
            "<script type="module" src="feroom-module/module/index.js"></script>
            <script type="module" src="feroom-module/module-root/root-app.js"></script>"
        `)
    })
})
