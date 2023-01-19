import { FeRoomConfig } from '../config'
import { FeRoomIndex } from '../index-html'
import { FeRegistry } from '../registry'

const config = new FeRoomConfig({
    importMap: {
        'test': 'test.js',
    },
    globals: {
        _VAR_: 'var-value',
        process: { env: { NODE_ENV: 'dev' } },
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
    title: 'Title',
    head: '<meta />',
    body: '<!-- body -->',
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
            appendHead: '<meta module v1 />',
        },
    },
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
            preloadEntry: 'body:last',
        },
    },
})
reg.registerModule({
    id: 'module2',
    version: '2',
    files: {},
    activate: true,
    config: {
        registerOptions: {
            entry: 'index2.js',
            preloadScripts: ['m2-1.js', 'm2-2.js'],
            preloadCss: 'm2.css',
            preloadEntry: 'body:last',
        },
    },
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
            globals: {
                __MODULE__: 'value',
            },
            entry: 'root-app.js',
            appendBody: '<div id="#module-root" />',
            preloadEntry: true,
        },
    },
})

const index = new FeRoomIndex(reg, config, [
    () => ({
        name: 'TestExt',
        instance: {
            injectGlobals: () => ({EXT:  true}),
            injectHead: () => '<meta> from ext </meta>',
            injectIndexBody: () => '<span> from ext </span>',
            injectImportMap: () => ({ fromExt: './toExt' }),            
        },
    }),
])

describe('index-html', () => {
    const modules = index.getModules()
    
    it('must render import map', async () => {
        jest.setTimeout(20000)
        await reg.registerFromNpm({ name: 'vue', version: '3.2.45' })
        const modules = index.getModules()
        expect(await index.getImportmap(modules)).toMatchInlineSnapshot(`
"{
  "module": "/feroom-module/module@1/index.js",
  "module2": "/feroom-module/module2@2/index2.js",
  "module-root": "/feroom-module/module-root@1/root-app.js",
  "module2@1": "/feroom-module/module2@1/index2.js",
  "vue": "/feroom-module/vue@3.2.45/dist/vue.runtime.esm-bundler.js",
  "fromExt": "./toExt",
  "test": "test.js"
}"
`)
    })

    it('must render globals', async () => {
        expect(await index.getGlobals(modules)).toMatchInlineSnapshot(`
"window["EXT"] = true;
window["__MODULE__"] = "value";
window["_VAR_"] = "var-value";
window["process"] = {"env":{"NODE_ENV":"dev"}};
window["__feroom"] = {"modulesPrefixPath":"feroom-module/"};
"
`)
    })

    it('must render css links', () => {
        expect(index.getCss(modules)).toMatchInlineSnapshot(`
"<link type="text/css" rel="stylesheet" href="stand-alone.css">
<link type="text/css" rel="stylesheet" href="feroom-module/module2@2/style.css">
<!-- module@1: Preload Css -->
<link type="text/css" rel="stylesheet" href="feroom-module/module@1/m1-1.css">
<link type="text/css" rel="stylesheet" href="feroom-module/module@1/m1-2.css">
<!-- module2@2: Preload Css -->
<link type="text/css" rel="stylesheet" href="feroom-module/module2@2/m2.css">

"
`)
    })

    it('must render preload script links', () => {
        expect(index.getScripts(modules)).toMatchInlineSnapshot(`
"<script type="module" src="stand-alone.js"></script>
<script type="module" src="feroom-module/module2@2/bundle.js"></script>
<!-- module@1: Preload Script -->
<script type="module" src="feroom-module/module@1/m1.js"></script>
<!-- module2@2: Preload Script -->
<script type="module" src="feroom-module/module2@2/m2-1.js"></script>
<script type="module" src="feroom-module/module2@2/m2-2.js"></script>

"
`)
    })

    it('must render script links for module preload', () => {
        expect(index.getPreloadModule(modules)).toMatchInlineSnapshot(`
"<!-- module@1: Preload Entry -->
<script type="module" src="feroom-module/module@1/index.js"></script>
<!-- module-root@1: Preload Entry -->
<script type="module" src="feroom-module/module-root@1/root-app.js"></script>"
`)
    })

    it('must render head', async () => {
        expect(await index.getHead(modules)).toMatchInlineSnapshot(`
"<title>Title</title>
<meta />
<!-- module@1: Append Head -->
<meta module v1 />
<!-- EXT: TestExt -->
<meta> from ext </meta>
"
`)
    })

    it('must render body', async () => {
        expect(await index.getBody(modules)).toMatchInlineSnapshot(`
"<!-- body -->
<!-- module-root@1: Append Body -->
<div id="#module-root" />
<!-- module2@2: Preload Entry -->
<script type="module" src="feroom-module/module2@2/index2.js"></script>
<!-- EXT: TestExt -->
<span> from ext </span>
"
`)
    })
})
