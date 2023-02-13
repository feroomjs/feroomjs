import { TFeConfigExt } from '..'
import { pkg } from '../../utils'
import { getVueRenderedRoutes } from '../vue-routes'

export const configVueRoutesExt: TFeConfigExt = {
    transformConfig(data, config) {
        const id = data.registerOptions?.id || pkg?.name
        if (data.extensions?.vueRoutes) {
            data.extensions.vueRoutes = getVueRenderedRoutes(data.extensions.vueRoutes, id, config.devMode)
        }
        return data
    },
}
