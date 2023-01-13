import { Controller } from 'moost'
import { FeRoomConfig } from './config'
import { FeRegistry } from './registry'
import { useSetHeader } from '@wooksjs/event-http'
import { FeModule } from './module'
import { Get } from '@moostjs/event-http'
import { renderCssTag, renderModuleScriptTag } from './utils'

@Controller()
export class FeRoomIndex {
    constructor(protected _registry: FeRegistry, protected config: FeRoomConfig) {}

    getModules(): FeModule[] {
        return this._registry.getAllModules().map(data => new FeModule(data, this.config))
    }

    getGlobals(modules: FeModule[]) {
        return Object.keys(this.config.globals).map(key => `window[${ JSON.stringify(key) }] = ${JSON.stringify(this.config.globals[key as keyof typeof this.config.globals])};\n`).join('')
    }

    getImportmap(modules: FeModule[]) {
        const map: Record<string, string> = {}
        modules.forEach(module => Object.assign(map, module.getImportMap()))

        return JSON.stringify({
            ...map,
            ...this.config.importMap,
        }, null, '  ')
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
        modules.forEach(m => (this.config.preloadModule.includes(m.id) || m.getRegisterOptions().preloadRoot) && items.push(m))
        return items
            .map(m => m.renderPreloadModule())
            .join('\n')
    }

    getHead(modules: FeModule[]) {
        let content = (this.config.head || '') + '\n'
        modules.forEach(m => m.getRegisterOptions().appendHead ? content += m.getRegisterOptions().appendHead + '\n' : null)
        return content
    }

    getBody(modules: FeModule[]) {
        let content = (this.config.body || '') + '\n'
        modules.forEach(m => m.getRegisterOptions().appendBody ? content += m.getRegisterOptions().appendBody + '\n' : null)
        return content
    }

    @Get('')
    @Get('index.html')
    index() {
        useSetHeader('content-type').value = 'text/html'
        const modules = this.getModules()
        return `<html>
<head>
<title>${ this.config.title }</title>
${ this.getHead(modules) }
<script>
// globals
${ this.getGlobals(modules) }
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

<script type="importmap">
{
    "imports": ${ this.getImportmap(modules) }
}
</script>

${ this.getScripts(modules) }
${ this.getPreloadModule(modules) }
${ this.getCss(modules) }

</head>
<body>
${ this.getBody(modules) }
</body>
</html>`
    }
}
