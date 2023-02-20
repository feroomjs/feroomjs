import { TFeRoomServerOptions, TNpmModuleData } from 'common'

export class FeRoomConfig {
    constructor(protected options: TFeRoomServerOptions) {}

    get modulesPrefixPath() {
        return this.options.modulesPrefixPath || 'feroom/module/'
    }

    get devMode() {
        return this.options.devMode
    }

    get globals() {
        return this.options.globals || {}
    }

    get title() {
        return this.options.title || 'FeRoom'
    }

    get preloadCss() {
        return this.options.preloadCss || []
    }

    get preloadScript() {
        return this.options.preloadScript || []
    }

    get preloadModule() {
        return this.options.preloadModule || []
    }

    get body() {
        return this.options.body || ''
    }

    get head() {
        return this.options.head || ''
    }

    get importMap() {
        return this.options.importMap || {}
    }

    get npmDeps(): TNpmModuleData[] {
        const deps = this.options.importNpmDependencies || {}
        return Object.entries(deps).map(([name, value]) => ({...value, name}))
    }
}
