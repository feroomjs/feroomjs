import { FeRegistry } from '@feroomjs/feroom'
import { TRoutesCfg, VueRoutesController } from './vue-routes'

const reg = new FeRegistry<TRoutesCfg>()
reg.registerModule({
    id: 'module',
    version: '1',
    files: {},
    config: {
        entry: 'dummy',
        vueRoutes: [{ path: '/m1path', name: 'm1:index', component: '() => import(\'module\')' }],
    }
})
reg.registerModule({
    id: 'module2',
    version: '1',
    files: {},
    config: {
        entry: 'dummy',
        vueRoutes: [
            { path: '/m2path', name: 'm2:index', component: '() => import(\'module2\')', children: [
                { path: 'm2chld', name: 'm2:chld1', component: '() => import(\'module2\')' },
                { path: 'm2chld2', name: 'm2:chld2', component: '() => import(\'module2\')' },
            ] }
        ],
    }
})
reg.registerModule({
    id: 'module-root',
    version: '1',
    files: {},
    config: {
        entry: 'dummy',
        vueRoutes: [],
    }
})

const vueRoutes = new VueRoutesController(reg)

describe('vue-routes', () => {
    it('must render routes', () => {
        expect(vueRoutes.routes()).toMatchInlineSnapshot(`
"export const vueRoutes = [{
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
