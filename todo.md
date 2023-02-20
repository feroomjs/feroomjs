# ToDo

## Register

- `autoImportDeps` - flag to enable import "dependencies" of registered module

## Build

- add types declarations emits

## devServer

- option to pre-load server configuration from prod (test) server
- option to describe proxies

## Server

- pre-compute `index.html` state on each module update
- add `e-tag` to served modules files (sha?)

## Common

- ✔ re-design appending css to modules (use virtual dep `@feroom-ext/feroom-utils`?)

## Persistance

- implement persistancy adapter on (documentDB? mongoDB? dynamoDB? S3?)

## CLI

- add create feroom server option (from template)
- add create feroom MFE option (from template)
