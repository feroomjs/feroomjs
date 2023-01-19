import { panic } from 'common'
import { feroomMate } from './mate'

const insureInjectable = feroomMate.decorate((meta) => {
    if (!meta.injectable) meta.injectable = true
    return meta
})

export function FeRoomExtension(name: string) {
    if (!name) {
        throw panic('Decorator @FeRoomExtension(name: string) requires "name" to be filled. Received empty name.')
    }
    return feroomMate.apply(
        insureInjectable,
        feroomMate.decorateClass('feroom_isExtension', true),
        feroomMate.decorateClass('feroom_extensionName', name),
    )
}
