import { Cli, CliParam } from '@moostjs/event-cli'
import { Controller, Injectable } from 'moost'
// import { esBuildBundle, logger } from '@feroomjs/tools'
// import { panic } from 'common'
import { build } from 'vite'
import vue from '@vitejs/plugin-vue'
import { FeRoomConfigFile, feroomForVitePlugin, logger, pkg } from '@feroomjs/tools'
import { virtualIndexName } from 'common'

@Injectable('FOR_EVENT')
@Controller()
export class CliBuild {
    @CliParam(['c', 'configPath'], 'Path to the FeRoom Config file.')
    // @Validate(({ value: v }) => typeof v !== 'undefined' && typeof v !== 'string' ? 'string value expected with path to FeRoom Config file.' : true)
    configPath?: string

    @Cli()
    async build() {
        // logger.title('FeRoom Build')

        // if (typeof this.configPath !== 'undefined' && typeof this.configPath !== 'string') throw panic('Key -c must have string value.')

        // await esBuildBundle(this.configPath)
        
        // logger.info('\n✔ Build done')
        
        const config = new FeRoomConfigFile(this.configPath, true)
        const configData = await config.get()
        const buildHelpers = await config.getBuildHelpers()

        for (const key of Object.keys(buildHelpers.paths)) {
            logger.step(`Locking version of "${ buildHelpers.paths[key] }"`)
        }

        for (const dep of buildHelpers.bundle) {
            logger.step(`Bundling in "${ dep }"`)
        }

        await build({
            configFile: false,
            root: process.cwd(),
            base: '/foo/',
            plugins: [
                vue(),
                feroomForVitePlugin({
                    configData,
                    renderedConf: await config.render(),
                    paths: buildHelpers.paths,
                }),
            ],
            resolve: {
                alias: buildHelpers.paths,
            },
            build: {
                outDir: buildHelpers.outDir,
                lib: {
                    entry: virtualIndexName,
                    name: pkg.name,
                    fileName: buildHelpers.fileName,
                    formats: ['es'],
                },
                rollupOptions: {
                    external: [
                        ...buildHelpers.externalNoLock,

                        // ext dynamic imports
                        /^@feroom-ext\//,
                    ],
                },
            },
            optimizeDeps: {
                entries: [virtualIndexName],
            },            
        })

        process.exit(0)
        // return 'Done'
    }
}
