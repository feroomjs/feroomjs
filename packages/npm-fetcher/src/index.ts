import { fetchDistTags, fetchTgz } from './fetcher'
import { unpackTgzToMemory } from './unpack'
import { pKey } from './utils'

const cache: Record<string, Promise<Record<string, string>>> = {}

export async function getNpmPackageVersion(registryUrl: string, packageName: string, version?: string) {
    if (!version) {
        const tags = await fetchDistTags(registryUrl, packageName)
        version = tags.latest
    }
    return version
}

export async function getNpmPackageFiles(registryUrl: string, packageName: string, version?: string) {
    if (!version) {
        const tags = await fetchDistTags(registryUrl, packageName)
        version = tags.latest
    }
    const k = pKey(packageName, version)
    if (!cache[k]) {
        const res = await fetchTgz(registryUrl, packageName, version)
        cache[k] = unpackTgzToMemory(res.body as ReadableStream)
    }
    return cache[k]
}
