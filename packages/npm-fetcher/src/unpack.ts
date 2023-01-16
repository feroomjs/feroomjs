// import { Stream } from 'node:stream'
import { createGunzip } from 'node:zlib'
import { extract } from 'tar-stream'
import { pipeline } from 'node:stream'

export function unpackTgzToMemory(buffer: ReadableStream): Promise<Record<string, string | Buffer>> {
    return new Promise((resolve, reject) => {
        const ex = extract()
        const files: Record<string, string | Buffer> = {}
        ex.on('entry', function (header, stream, cb) {
            stream.on('data', function (chunk) {
                const fileName = header.name.replace(/^package\//, '')
                const isText = fileName.endsWith('.js') || fileName.endsWith('.map') || fileName.endsWith('.css') || fileName.endsWith('.json') 
                    || fileName.endsWith('.txt') || fileName.endsWith('.mjs') || fileName.endsWith('.cjs') || fileName.endsWith('.md') || fileName.endsWith('.html')
                if (!files[fileName]) {
                    files[fileName] = isText ? chunk.toString() : chunk
                } else {
                    if (isText) files[fileName] += chunk;
                    if (!isText) files[fileName] = Buffer.concat([files[fileName], chunk])
                }
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
