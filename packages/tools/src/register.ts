import { log, logError, warn } from 'common/log'
import { getFeConf } from './fe-conf'
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
        const conf = JSON.parse(JSON.stringify(getFeConf()))
        const id = conf.id || pkg.name
        if (conf.vueRoutes) {
            conf.vueRoutes = getVueRenderedRoutes(getVueRoutes(), id)
        }
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
        if (!conf.entry) {
            conf.entry = pkg.module || pkg.main
        }
        if (!files[conf.entry]) {
            warn(`Entry "${ conf.entry }" file is not included in files list`)
        }
        files['feroom.config.json'] = JSON.stringify(conf)
        if (!files['package.json']) {
            files['feroom.config.json'] = JSON.stringify(pkg)
        }
        const res = await fetch(this.getUrl('feroom-module/register'), {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                id,
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
