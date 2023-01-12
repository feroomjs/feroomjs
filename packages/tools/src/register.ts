import { log, logError, warn } from 'common/log'
import { getFeConf, renderFeConf } from './fe-conf'
import { getFilesByPattern, pkg, unbuildPath } from './utils'
import { readFileSync } from 'node:fs'
import { panic } from 'common/panic'
import { getVueRenderedRoutes, getVueRoutes } from './vue-routes'

export class FeRoomRegister {
    constructor(private opts: {
        host: string
    }) {}

    getUrl(path: string) {
        if (path.startsWith('/')) path = path.slice(1)
        let host = this.opts.host
        if (host.endsWith('/')) host = host.slice(0, host.length - 1)
        return host + '/' + path
    }

    async register() {
        const conf = renderFeConf()
        const id = conf.id || pkg.name
        const files: Record<string, string | Buffer> = {}
        const paths = await getFilesByPattern(conf.include || pkg.files, conf.exclude)
        for (const path of paths) {
            const relPath = unbuildPath(path)
            if (path.endsWith('.js') || path.endsWith('.map') || path.endsWith('.css') || path.endsWith('.json') || path.endsWith('.txt') || path.endsWith('.mjs') || path.endsWith('.cjs')) {
                files[relPath] = readFileSync(path).toString()
            } else {
                files[relPath] = readFileSync(path)
            }
            log(`${ __DYE_CYAN__ }+ ${ relPath }`)
        }
        if (!files[conf.entry as string]) {
            warn(`Entry "${ conf.entry }" file is not included in files list`)
        }
        if (!files['feroom.config.json']) {
            log(`${ __DYE_CYAN__ }+ feroom.config.json`)
        }
        files['feroom.config.json'] = JSON.stringify(conf)
        if (!files['package.json']) {
            files['package.json'] = JSON.stringify(pkg)
            log(`${ __DYE_CYAN__ }+ package.json`)
        }
        const res = await fetch(this.getUrl('feroom-module/register'), {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                id,
                version: pkg.version,
                files,
            })
        })
        if (res.status > 299) {
            const text = await res.text()
            logError(`Failed to register module "${ id }"`)
            throw panic(res.status + ' ' + text)
        } else {
            log(`✔ Module "${ id }" Registered`)
        }
    }
}
