export function renderCssTag(path: string): string {
    return `<link type="text/css" rel="stylesheet" href="${ path }">`
}

export function renderModuleScriptTag(path: string): string {
    return `<script type="module" src="${ path }"></script>`
}
