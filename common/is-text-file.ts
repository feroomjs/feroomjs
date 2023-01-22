export function isTextFile(path: string) {
    return path.endsWith('.js') || path.endsWith('.map') || path.endsWith('.css') || path.endsWith('.json') || path.endsWith('.txt')
        || path.endsWith('.mjs') || path.endsWith('.cjs') || path.endsWith('.md') || path.endsWith('.html')
}
