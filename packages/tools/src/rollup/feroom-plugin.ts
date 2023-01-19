
import { Plugin } from 'rollup'
import { TFeRoomConfig } from 'common'

export const feRoomConfPlugin = (conf: TFeRoomConfig): Plugin => {
    return {
        name: 'feroom-conf-plugin',
        buildEnd() {
            this.emitFile({
                type: 'asset',
                fileName: 'feroom.config.json',
                source: JSON.stringify(conf),
            })
        },
    }
}
