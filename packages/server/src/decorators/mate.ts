import { Mate } from '@prostojs/mate'
import { getMoostMate, TMoostMetadata } from 'moost'

export interface TFeroomMetadata {
    feroom_isExtension?: boolean
    feroom_extensionName?: string
}

export const feroomMate: Mate<TMoostMetadata & TFeroomMetadata & TFeroomMetadata & TFeroomMetadata> = getMoostMate() as Mate<TMoostMetadata & TFeroomMetadata & TFeroomMetadata & TFeroomMetadata>
