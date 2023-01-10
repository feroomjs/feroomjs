import { fetchDistTags, fetchPackageInfo, fetchTgz } from "./fetcher"
import { unpackTgzToMemory } from "./unpack"

describe('npm-fetcher', () => {
    it('must fetch package dist-tags', async () => {
        const tags = await fetchDistTags('https://registry.npmjs.org', 'wooks')
        expect(tags).toBeDefined()
        expect(tags).toHaveProperty('latest')
        expect(tags.latest).toBeDefined()
    })
    it('must fetch package info', async () => {
        const pkg = await fetchPackageInfo('https://registry.npmjs.org', 'wooks')
        expect(pkg).toBeDefined()
        expect(pkg).toHaveProperty('dist')
        expect(pkg.dist).toHaveProperty('tarball')
    })
    it('must fetch tgz', async () => {
        const res = await fetchTgz('https://registry.npmjs.org', 'wooks')
        expect(res.status).toBe(200)
    })
    it('must unpack files', async () => {
        const res = await fetchTgz('https://registry.npmjs.org', 'wooks')
        const files = await unpackTgzToMemory(res.body as ReadableStream)
        console.log(files['package.json'])
        expect(files['package.json']).toBeDefined()
    })
})
