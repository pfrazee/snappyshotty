import { readRepo } from './src/repos.mjs'

const repo = await readRepo('did:plc:ragtjsm2j2vknwkz3zp4oxrd')
console.log((await repo.getContents())['app.bsky.graph.follow'])
