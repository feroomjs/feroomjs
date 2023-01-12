import { join } from 'path'
import glob from 'glob'
import { readFileSync } from 'node:fs'

export const rootPath = process.cwd()

export function buildPath(...parts: string[]) {
    return join(rootPath, ...parts)
}

export function unbuildPath(path: string) {
    if (path.startsWith(rootPath)) {
        return path.slice(rootPath.length + 1)
    }
    return path
}

export async function getFilesByPattern(include: string[] = [], exclude: string[] = []): Promise<string[]> {
    const files: Record<string, boolean> = {}
    for (const path of include.map(p => buildPath(p))) {
        for (const file of (await globPromise(path))) {
            files[file] = true
        }
    }
    for (const path of exclude.map(p => buildPath(p))) {
        for (const file of (await globPromise(path))) {
            files[file] = false
        }
    }
    return Object.keys(files).filter(file => files[file])
}

export function globPromise(path: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        glob(path, (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}

export const pkg = JSON.parse(readFileSync(buildPath('./package.json')).toString())