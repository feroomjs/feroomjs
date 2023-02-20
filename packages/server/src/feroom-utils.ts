import { Get, SetHeader } from '@moostjs/event-http'
import { TFeRoomExtension } from 'common'
import { Controller } from 'moost'
import { FeRoomConfig } from './config'
import { FeRoomExtension } from './decorators'

@FeRoomExtension('feroom-utils')
@Controller()
export class FeRoomUtils implements TFeRoomExtension {
    constructor(private config: FeRoomConfig) {}

    injectImportMap() {
        return {
            '@feroom-ext/feroom-utils': '/feroom-ext/feroom-utils.js',
        }
    }

    @Get('/feroom-ext/feroom-utils.js')
    @SetHeader('content-type', 'application/javascript')
    utils() {
        return `
    var separator = '/'
    var replace = new RegExp(separator+'{1,}', 'g');
    function join(...parts){
        return parts.map(s => s.replace(/^\\.\\//, separator)).join(separator).replace(replace, separator);
    } 
    export var modulesPrefixPath = ${ JSON.stringify(this.config.modulesPrefixPath) }
    export function resolveModuleFile(id, file, version) {
        return join('/', modulesPrefixPath, version ? (id + '@' + version) : id, file)
    }
    var preloadedCss = {}
    export function preloadCss(id, file, version) {
        var key = [id, file, version].join('|')
        if (!preloadedCss[key]) {
            var head  = document.getElementsByTagName('head')[0];
            var link  = document.createElement('link');
            link.rel  = 'stylesheet';
            link.type = 'text/css';
            link.href = '.' + resolveModuleFile(id, file, version);
            link.media = 'all';
            head.appendChild(link);
            preloadedCss[key] = link;
        }
    }   
`
    }
}
