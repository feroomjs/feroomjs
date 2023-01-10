// import { Stream } from 'node:stream'
import { createGunzip } from 'node:zlib'
import { extract } from 'tar-stream'
import { pipeline } from 'node:stream'

export function unpackTgzToMemory(buffer: ReadableStream): Promise<Record<string, string>> {
    return new Promise((resolve, reject) => {
        const ex = extract()
        const files: Record<string, string> = {}
        ex.on('entry', function (header, stream, cb) {
            stream.on('data', function (chunk) {
                const fileName = header.name.replace(/^package\//, '')
                if (fileName.startsWith('src/')) return
                files[fileName] = files[fileName] || ''
                files[fileName] += chunk;
            });
    
            stream.on('end', function () {
                cb();
            });
    
            stream.resume()
        });
        ex.on('finish', () => {
            resolve(files)
        })
        pipeline(buffer as unknown as NodeJS.ReadableStream, createGunzip(), ex, reject)
    })
}
