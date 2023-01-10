import { panic } from 'common/panic'
import { join } from 'path'
import { TDistTags, TPackageInfo } from './types'

const tagsCache: Record<string, TDistTags> = {}

export async function fetchDistTags(registryUrl: string, packageName: string): Promise<TDistTags> {
    if (!tagsCache[packageName]) {
        const res = await fetch(join(registryUrl, '-', 'package', packageName, 'dist-tags'))
        if (res.status > 200) {
            throw panic(`Could not read dist-tags of "${packageName}"\n` + await res.text())
        }
        tagsCache[packageName] = JSON.parse(await res.text())
    }
    return tagsCache[packageName]
}

export async function fetchPackageInfo(registryUrl: string, packageName: string, packageVersion?: string): Promise<TPackageInfo> {
    if (!packageVersion) {
        packageVersion = (await fetchDistTags(registryUrl, packageName)).latest
    }
    if (!packageVersion) {
        throw panic(`Could not determine the latest version of "${packageName}"`)
    }
    const res = await fetch(join(registryUrl, packageName, packageVersion))
    if (res.status > 200) {
        throw panic(`Could not read package "${packageName}"\n` + await res.text())
    }
    return JSON.parse(await res.text())
}

export async function fetchTgz(registryUrl: string, packageName: string, packageVersion?: string) {
    const pkg = await fetchPackageInfo(registryUrl, packageName, packageVersion)
    const res = await fetch(pkg.dist.tarball)
    if (res.status > 200) {
        throw panic(`Could not fetch package "${packageName}"\n` + await res.text())
    }
    return res
}
