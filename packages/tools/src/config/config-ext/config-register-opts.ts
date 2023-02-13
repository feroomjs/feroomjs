import { panic } from 'common'
import { TFeConfigExt } from '..'
import { pkg } from '../../utils'

export const configRegisterOptsExt: TFeConfigExt = {
    transformConfig(data) {
        data.registerOptions = data.registerOptions || {}
        const id = data.registerOptions.id || pkg?.name
        if (!id) throw panic('Could not resolve module id. Please use option "registerOptions.id".')
        if (!data.registerOptions.entry) {
            data.registerOptions.entry = pkg?.module || pkg?.main
        }
        return data
    },
}
