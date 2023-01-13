

import { Plugin } from 'rollup'
import { getFeConf, renderFeConf } from '../fe-conf'
import { TFeRoomConfig } from 'common'

export const feroomConfPlugin = (path?: string | TFeRoomConfig): Plugin => {
    return {
      name: 'feroom-conf-plugin',
      buildEnd() {
        const conf = getFeConf(path)
        this.emitFile({
            type: 'asset',
            fileName: 'feroom.config.json',
            source: JSON.stringify(renderFeConf(conf))
        })
      }
    }
} 