export interface TVueRoute {
    path: string
    component?: string
    children?: TVueRoute[]
    name?: string
    props?: boolean
}
