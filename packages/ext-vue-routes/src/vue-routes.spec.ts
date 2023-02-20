import { FeRegistry } from '@feroomjs/server'
import { TVueRoutesCfg } from 'common'
import { VueRoutesExt } from './vue-routes'

const reg = new FeRegistry<TVueRoutesCfg>()
reg.registerModule({
    id: 'module',
    version: '1',
    files: {},
    entry: 'dummy',
    config: {
        extensions: {
            vueRoutes: [{ path: '/m1path', name: 'm1:index', component: '() => import(\'module\')' }],
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
            vueRoutes: [
                { path: '/m2path', name: 'm2:index', component: '() => import(\'module2\')', children: [
                    { path: 'm2chld', name: 'm2:chld1', component: '() => import(\'module2\')' },
                    { path: 'm2chld2', name: 'm2:chld2', component: '() => import(\'module2\')' },
                ] },
            ],
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

const vueRoutes = new VueRoutesExt(reg)

describe('ext-vue-routes', () => {
    it('must render routes', () => {
        expect(vueRoutes.routes()).toMatchInlineSnapshot(`
"import * as feUtils from '@feroom-ext/feroom-utils';
export const vueRoutes = [{
  "path": "/m1path",
  "name": "m1:index",
  "component": () => import('module'),
},
{
  "path": "/m2path",
  "name": "m2:index",
  "component": () => import('module2'),
  "children": [
  {
    "path": "m2chld",
    "name": "m2:chld1",
    "component": () => import('module2'),
  },
  {
    "path": "m2chld2",
    "name": "m2:chld2",
    "component": () => import('module2'),
  },
  ],
},
]
export default vueRoutes"
`)
    })
})
