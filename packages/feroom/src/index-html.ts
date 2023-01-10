import { Get } from '@moostjs/event-http'
import { join } from 'path'
import { Controller } from 'moost'
import { FeRoomConfig } from './config'
import { FeRegistry } from './registry'
import { TModuleData } from './types'
import { useSetHeader } from '@wooksjs/event-http'

@Controller()
export class FeRoomIndex {
    constructor(protected _registry: FeRegistry, protected config: FeRoomConfig) {}

    getGlobals() {
        return Object.keys(this.config.globals).map(key => `\twindow[${ JSON.stringify(key) }] = ${JSON.stringify(this.config.globals[key as keyof typeof this.config.globals])};\n`).join('')
    }

    getImportmap() {
        const list = this._registry.getModulesList()
        return list
            .map(id => this._registry.readModule(id))
            .map((m: TModuleData) => `"${m.id}": "./${ join(this.config.modulesPrefixPath, m.id, m.rootFile) }"`)
            .join(',\n\t\t')
    }

    getModulePath(id: string, path?: string) {
        const m = this._registry.readModule(id)
        return join(this.config.modulesPrefixPath, m.id, path || m.rootFile)
    }

    getCss() {
        return this.config.preloadCss.map(path => {
            let target = path
            if (Array.isArray(path)) {
                target = this.getModulePath(path[0], path[1])
            }
            return `<link type="text/css" rel="stylesheet" href="${ target }">`
        }).join('\n')
    }

    getScripts() {
        return this.config.preloadScript.map(path => {
            let target = path
            if (Array.isArray(path)) {
                target = this.getModulePath(path[0], path[1])
            }            
            return `<script type="module" src="${ target }"></script>`
        }).join('\n')
    }

    getPreloadModule() {
        return this.config.preloadModule
            .map(id => this.getModulePath(id))
            .map(path => `<script type="module" src="${ path }"></script>`)
            .join('\n')
    }

    @Get('')
    @Get('index.html')
    index() {
        useSetHeader('content-type').value = 'text/html'
        return `<html>
<head>
<title>${ this.config.title }</title>
${ this.config.head }
<script>
// globals
${ this.getGlobals() }
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
    "imports": {
        ${ this.getImportmap() }
    }
}
</script>

${ this.getScripts() }
${ this.getPreloadModule() }
${ this.getCss() }

</head>
<body>
${ this.config.body }
</body>
</html>`
    }
}
