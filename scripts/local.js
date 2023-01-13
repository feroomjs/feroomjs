import minimist from 'minimist'
const args = minimist(process.argv.slice(2))
import fs from 'fs'
import path from 'path'

import { packages, version, out } from './utils.js'

const mainModule = 'feroom'
const deps = '@feroomjs/'

const revert = args.revert || args.r

function buildPath(p) {
  return revert ? version : `file:../${ p.split('/').pop() }`
}

packages.forEach(({shortName, name, pkg, pkgPath}) => {
    if (pkg?.private) return
    out.step('Package ' + name + ':')
    if (pkg.dependencies) {
      if (pkg.dependencies[mainModule]) {
        pkg.dependencies[mainModule] = buildPath(mainModule)
      }
      out.info(`dependencies.${mainModule} => ${ buildPath(mainModule) }`)
      for (const key of Object.keys(pkg.dependencies)) {
        if (key.startsWith(deps)) {
          pkg.dependencies[key] = buildPath(key)
          out.info(`dependencies.${key} => ${ buildPath(key) }`)
        }
      }
    }
    if (pkg.peerDependencies) {
      if (pkg.peerDependencies[mainModule]) {
        pkg.peerDependencies[mainModule] = buildPath(mainModule)
      }
      out.info(`peerDependencies.${mainModule} => ${ buildPath(mainModule) }`)
      for (const key of Object.keys(pkg.peerDependencies)) {
        if (key.startsWith(deps)) {
          pkg.peerDependencies[key] = buildPath(key)
          out.info(`peerDependencies.${key} => ${ buildPath(key) }`)
        }
      }
    }
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, '  ') + '\n')
  })
