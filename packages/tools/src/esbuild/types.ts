import * as esbuild from 'esbuild'

export type TESReBuildCallback = (result: esbuild.BuildResult<esbuild.BuildOptions>, dir: string) => void | Promise<void>
