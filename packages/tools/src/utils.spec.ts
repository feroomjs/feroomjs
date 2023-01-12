import { getFilesByPattern, unbuildPath } from "./utils"

describe('tools utils', () => {
    it('must process include/exclude patterns', async () => {
        expect(await getFilesByPattern(['./scripts/**/*'], ['./scripts/bootstrap.js'])).toMatchInlineSnapshot(`
[
  "/home/amaltsev/feroomjs/scripts/build.js",
  "/home/amaltsev/feroomjs/scripts/deps.js",
  "/home/amaltsev/feroomjs/scripts/jiti.js",
  "/home/amaltsev/feroomjs/scripts/release.js",
  "/home/amaltsev/feroomjs/scripts/utils.js",
  "/home/amaltsev/feroomjs/scripts/verifyCommit.js",
]
`)
    })
    it('must unbuild path', () => {
        expect(unbuildPath('/home/amaltsev/feroomjs/scripts/bootstrap.js')).toEqual('scripts/bootstrap.js')
    })
})