import { FeRegistry } from '@feroomjs/server'
import { TSharedMenuCfg } from 'common'
import { SharedMenuExt } from './shared-menu'

const reg = new FeRegistry<TSharedMenuCfg>()
reg.registerModule({
    id: 'module',
    version: '1',
    files: {},
    entry: 'dummy',
    config: {
        extensions: {
            sharedMenu: {
                'Module 1': { route: 'm1' },
                'Main Menu': {
                    children: {
                        '1 Sub Menu 1': { route: 'm1-s1' },
                        '1 Sub Menu 2': { route: 'm1-s2' },
                    },
                },
            },
        },
    },
})
reg.registerModule({
    id: 'module2',
    version: '1',
    files: {},
    entry: 'dummy',
    config: {
        extensions: {
            sharedMenu: {
                'Module 2': { route: 'm2' },
                'Main Menu': {
                    children: {
                        'Sub Menu 1': { route: 'm2-s1' },
                        'Sub Menu 2': { route: 'm2-s2' },
                    },
                },
            },
        },
    },
})
reg.registerModule({
    id: 'module-root',
    version: '1',
    files: {},
    entry: 'dummy',
    config: {
    },
})

const sharedMenu = new SharedMenuExt(reg)

describe('ext-shared-menu', () => {
    it('must render menu', () => {
        expect(sharedMenu.menu()).toMatchInlineSnapshot(`
"export const sharedMenu = {
  "Module 1": {
    "route": "m1"
  },
  "Main Menu": {
    "children": {
      "1 Sub Menu 1": {
        "route": "m1-s1"
      },
      "1 Sub Menu 2": {
        "route": "m1-s2"
      },
      "Sub Menu 1": {
        "route": "m2-s1"
      },
      "Sub Menu 2": {
        "route": "m2-s2"
      }
    }
  },
  "Module 2": {
    "route": "m2"
  }
}
export default sharedMenu"
`)
    })
})
