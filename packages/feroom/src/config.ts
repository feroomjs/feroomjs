import { TFeRoomOptions } from './types'

export class FeRoomConfig {
    constructor(protected options: TFeRoomOptions) {}

    get modulesPrefixPath() {
        return this.options.modulesPrefixPath || 'feroom-module/'
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

}