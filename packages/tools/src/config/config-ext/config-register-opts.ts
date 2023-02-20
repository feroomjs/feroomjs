import { panic } from 'common'
import { TFeConfigExt } from '..'
import { pkg } from '../../utils'

export const configRegisterOptsExt: TFeConfigExt = {
    transformConfig(data) {
        data.register = data.register || {}
        const id = data.register.id || pkg?.name
        if (!id) throw panic('Could not resolve module id. Please use option "registerOptions.id".')
        if (!data.register.entry) {
            data.register.entry = pkg?.module || pkg?.main
        }
        return data
    },
}
