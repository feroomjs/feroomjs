import { TFeRoomConfig } from 'common'
import { getFilesByPattern, pkg, unbuildPath } from './utils'
import { readFileSync } from 'node:fs'
import { FeRoomConfigFile } from './config'
import { logger } from './logger'

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

    async register(opts?: {conf?: TFeRoomConfig | string, activate?: boolean}) {
        const conf = await (new FeRoomConfigFile(opts?.conf).render())
        const id = conf.registerOptions?.id || pkg.name
        const files = await this.gatherFiles(conf)

        try {
            await this.postModule({
                id,
                version: pkg.version,
                files,
                activate: opts?.activate,
            })
            logger.info(`\n✔ Module "${ id }" Registered on ${ this.opts.host }`)
        } catch (e) {
            logger.error(`Failed to register module "${ id }"`)
            logger.error((e as Error).message)
            throw (e)
        }
    }

    async gatherFiles(conf: TFeRoomConfig) {
        logger.step('Lookup files...')
        const files: Record<string, string | Buffer> = {}
        const paths = await getFilesByPattern(conf.registerOptions?.include || pkg.files, conf.registerOptions?.exclude)
        for (const path of paths) {
            const relPath = unbuildPath(path)
            if (path.endsWith('.js') || path.endsWith('.map') || path.endsWith('.css') || path.endsWith('.json') || path.endsWith('.txt') || path.endsWith('.mjs') || path.endsWith('.cjs')) {
                files[relPath] = readFileSync(path).toString()
            } else {
                files[relPath] = readFileSync(path)
            }
            const dts = relPath.endsWith('.d.ts')
            logger.info(`• ${dts ? __DYE_DIM__ + __DYE_CYAN__ : ''}${ relPath } ${ __DYE_GREEN__+__DYE_DIM__ }→ ${ this.opts.host }`)
        }
        if (!files['feroom.config.json']) {
            logger.info(`${ __DYE_GREEN__ }• feroom.config.json ${ __DYE_DIM__ }→ ${ this.opts.host }`)
        }
        files['feroom.config.json'] = JSON.stringify(conf)
        if (!files['package.json']) {
            files['package.json'] = JSON.stringify(pkg)
            logger.info(`${ __DYE_GREEN__ }• package.json ${ __DYE_DIM__ }→ ${ this.opts.host }`)
        }
        if (!files[conf.registerOptions?.entry as string] && !files[(conf.registerOptions?.entry || '').replace(/^\.\//, '')]) {
            logger.warn(`Entry "${ conf.registerOptions?.entry }" file is not included in files list`)
        }
        return files
    }

    async postModule(module: { id: string, version: string, files: Record<string, string | Buffer>, activate?: boolean }) {
        logger.step('Posting files...')
        const res = await fetch(this.getUrl('feroom-module/register'), {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'accept': 'text/plain',
            },
            body: JSON.stringify(module)
        })
        if (res.status > 299) {
            const text = res.status + ' ' + (await res.text())
            logger.error(text)
            throw new Error(text)
        }
    }
}
