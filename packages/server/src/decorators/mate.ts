import { Mate, TProstoMetadata } from '@prostojs/mate'
import { getMoostMate, TMoostMetadata } from 'moost'

export interface TFeroomMetadata extends TProstoMetadata {
    feroom_isExtension?: boolean
    feroom_extensionName?: string
}

export const feroomMate = getMoostMate() as Mate<TMoostMetadata & TFeroomMetadata>
