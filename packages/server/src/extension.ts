
export interface TFeRoomExtension {
    injectGlobals?(): Record<string, unknown>
    injectImportMap?(): Record<string, string>
    injectHead?(): string
    injectIndexBody?(): string
}
