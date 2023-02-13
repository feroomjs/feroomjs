/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { Controller, Inject } from 'moost'
import { FeRoomConfig } from './config'
import { FeRegistry } from './registry'
import { FeModule } from './module'
import { Get, SetHeader } from '@moostjs/event-http'
import { renderCssTag, renderModuleScriptTag } from './utils'
import { TFeRoomExtension } from 'common'

interface TWrappedExt { instance: TFeRoomExtension, name: string }

@Controller()
export class FeRoomIndex {
    constructor(protected _registry: FeRegistry, protected config: FeRoomConfig, @Inject('FEROOM_EXT_ARRAY') protected ext: (() => Promise<TWrappedExt> | TWrappedExt)[]) {}

    async getExtInstances(): Promise<{ instance: TFeRoomExtension, name: string }[]> {
        const instances = []
        for (const ext of this.ext) {
            instances.push(await ext())
        }
        return instances
    }

    async getExtHead() {
        return (await this.getExtInstances()).map(e => e.instance.injectHead && (`<!-- EXT: ${ e.name } -->\n` + e.instance.injectHead())).join('\n') + '\n'
    }

    async getExtBody() {
        return (await this.getExtInstances()).map(e => e.instance.injectIndexBody && (`<!-- EXT: ${ e.name } -->\n` + e.instance.injectIndexBody())).join('\n') + '\n'
    }

    getModules(): FeModule[] {
        return this._registry.getAllModules().map(data => new FeModule(data, this.config))
    }

    async getGlobals(modules: FeModule[]) {
        let obj = {};
        (await this.getExtInstances()).forEach(e => e.instance.injectGlobals && Object.assign(obj, e.instance.injectGlobals()))
        modules.forEach(m => Object.assign(obj, m.getGlobals()))
        obj = { ...obj, ...this.config.globals, __feroom: { modulesPrefixPath: this.config.modulesPrefixPath } }
        return Object.keys(obj).map(key => `window[${ JSON.stringify(key) }] = ${JSON.stringify(obj[key as keyof typeof obj])};\n`).join('')
    }

    async getImportmapJson(modules: FeModule[]) {
        const map: Record<string, string> = {}
        modules.forEach(module => Object.assign(map, module.getImportMap(this._registry)));
        (await this.getExtInstances()).map(e => e.instance.injectImportMap && Object.assign(map, e.instance.injectImportMap()))

        return {
            ...map,
            ...this.config.importMap,
        }
    }

    async getImportmap(modules: FeModule[]) {
        return JSON.stringify(await this.getImportmapJson(modules), null, '  ')
    }

    getCss(modules: FeModule[]) {
        const preloadCss = this.config.preloadCss || []
        let content = ''
        preloadCss.forEach(item => {
            if (typeof item === 'string') {
                content += renderCssTag(item) + '\n'
            } else {
                const module = new FeModule(this._registry.readModule(item[0]), this.config)
                content += renderCssTag(module.buildPath(item[1])) + '\n'
            }
        })
        modules.forEach(m => content += m.renderPreloadCss())
        return content
    }

    getScripts(modules: FeModule[]) {
        const preloadScript = this.config.preloadScript || []
        let content = ''
        preloadScript.forEach(item => {
            if (typeof item === 'string') {
                content += renderModuleScriptTag(item) + '\n'
            } else {
                const module = new FeModule(this._registry.readModule(item[0]), this.config)
                content += renderModuleScriptTag(module.buildPath(item[1])) + '\n'
            }
        })
        modules.forEach(m => content += m.renderPreloadScript())
        return content
    }

    getPreloadModule(modules: FeModule[]) {
        const items: FeModule[] = []
        modules.forEach(m => (this.config.preloadModule.includes(m.id) || [true, 'head'].includes(m.getRegisterOptions().preloadEntry as boolean)) && items.push(m))
        return items
            .map(m => m.renderPreloadModule())
            .join('\n')
    }

    async getHead(modules: FeModule[]) {
        let content = `<title>${ this.config.title }</title>\n` + (this.config.head || '') + '\n'
        modules.forEach(m => m.getRegisterOptions().appendHead ? content += m.renderComment('Append Head') + m.getRegisterOptions().appendHead + '\n' : null)
        return content + await this.getExtHead()
    }

    async getBody(modules: FeModule[]) {
        let content = (this.config.body || '') + '\n'
        modules.forEach(m => m.getRegisterOptions().preloadEntry === 'body:first' && (content += m.renderPreloadModule() + '\n'))
        modules.forEach(m => m.getRegisterOptions().appendBody ? content += m.renderComment('Append Body') + m.getRegisterOptions().appendBody + '\n' : null)
        modules.forEach(m => m.getRegisterOptions().preloadEntry === 'body:last' && (content += m.renderPreloadModule() + '\n'))
        return content + await this.getExtBody()
    }

    @Get('')
    @Get('index.html')
    @SetHeader('content-type', 'text/html')
    async index() {
        const modules = this.getModules()
        return `<html>
<head>
<script type="importmap">
{
    "imports": ${ await this.getImportmap(modules) }
}
</script>
${ await this.getHead(modules) }
<script>
// globals
${ await this.getGlobals(modules) }
</script>

<script>
window.__loadCss = function (path) {
    const head  = document.getElementsByTagName('head')[0];
    const link  = document.createElement('link');
    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = './' + path;
    link.media = 'all';
    head.appendChild(link);
}
</script>

${ this.getScripts(modules) }
${ this.getPreloadModule(modules) }
${ this.getCss(modules) }

</head>
<body>
${ await this.getBody(modules) }
</body>
</html>`
    }
}
