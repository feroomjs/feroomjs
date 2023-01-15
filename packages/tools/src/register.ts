import { log, logError, warn, panic, TFeRoomConfig } from 'common'
import { renderFeConf } from './fe-conf'
import { getFilesByPattern, pkg, unbuildPath } from './utils'
import { readFileSync } from 'node:fs'

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

    async register(opts?: {conf?: TFeRoomConfig, activate?: boolean}) {
        const conf = renderFeConf(opts?.conf)
        const id = conf.registerOptions?.id || pkg.name
        const files = await this.gatherFiles(conf)

        try {
            await this.postModule({
                id,
                version: pkg.version,
                files,
                activate: opts?.activate,
            })
            log(`✔ Module "${ id }" Registered on ${ this.opts.host }`)
        } catch (e) {
            logError(`Failed to register module "${ id }"`)
            logError((e as Error).message)
            throw (e)
        }
    }

    async gatherFiles(conf: TFeRoomConfig) {
        const files: Record<string, string | Buffer> = {}
        const paths = await getFilesByPattern(conf.registerOptions?.include || pkg.files, conf.registerOptions?.exclude)
        for (const path of paths) {
            const relPath = unbuildPath(path)
            if (path.endsWith('.js') || path.endsWith('.map') || path.endsWith('.css') || path.endsWith('.json') || path.endsWith('.txt') || path.endsWith('.mjs') || path.endsWith('.cjs')) {
                files[relPath] = readFileSync(path).toString()
            } else {
                files[relPath] = readFileSync(path)
            }
            log(`${ __DYE_CYAN__ }+ ${ relPath }`)
        }
        if (!files[conf.registerOptions?.entry as string]) {
            warn(`Entry "${ conf.registerOptions?.entry }" file is not included in files list`)
        }
        if (!files['feroom.config.json']) {
            log(`${ __DYE_CYAN__ }+ feroom.config.json`)
        }
        files['feroom.config.json'] = JSON.stringify(conf)
        if (!files['package.json']) {
            files['package.json'] = JSON.stringify(pkg)
            log(`${ __DYE_CYAN__ }+ package.json`)
        }
        return files
    }

    async postModule(module: { id: string, version: string, files: Record<string, string | Buffer>, activate?: boolean }) {
        const res = await fetch(this.getUrl('feroom-module/register'), {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'accept': 'text/plain',
            },
            body: JSON.stringify(module)
        })
        if (res.status > 299) {
            const text = await res.text()
            throw panic(res.status + ' ' + text)
        }
    }
}
