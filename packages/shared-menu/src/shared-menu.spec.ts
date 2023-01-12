import { FeRegistry } from "@feroomjs/feroom"
import { SharedMenuController, TSharedMenuCfg } from "./shared-menu"


const reg = new FeRegistry<TSharedMenuCfg>()
reg.registerModule({
    id: 'module',
    version: '1',
    files: {},
    config: {
        entry: 'dummy',
        sharedMenu: {
            'Module 1': { route: 'm1' },
            'Main Menu': {
                children: {
                    '1 Sub Menu 1': { route: 'm1-s1' },
                    '1 Sub Menu 2': { route: 'm1-s2' },
                },
            },
        },
    }
})
reg.registerModule({
    id: 'module2',
    version: '1',
    files: {},
    config: {
        entry: 'dummy',
        sharedMenu: {
            'Module 2': { route: 'm2' },
            'Main Menu': {
                children: {
                    'Sub Menu 1': { route: 'm2-s1' },
                    'Sub Menu 2': { route: 'm2-s2' },
                },
            },
        },
    }
})
reg.registerModule({
    id: 'module-root',
    version: '1',
    files: {},
    config: {
        entry: 'dummy',
    }
})

const sharedMenu = new SharedMenuController(reg)

describe('vue-routes', () => {
    it('must render routes', () => {
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
