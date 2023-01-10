export interface TDistTags {
    latest: string
    [key: string]: string
}

export interface TPackageInfo {
    dist: {
        tarball: string
    }
}
