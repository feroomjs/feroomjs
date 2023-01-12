

import { Plugin } from 'rollup'
import { getFeConf, renderFeConf } from '../fe-conf'

export const feroomConfPlugin = (path?: string): Plugin => {
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