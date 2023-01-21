import * as esbuild from 'esbuild'

export type TESReBuildCallback = (result: esbuild.BuildResult<esbuild.BuildOptions>) => void | Promise<void>
