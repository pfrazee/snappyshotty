import { RELAY1_WEST, REPOS_JSON } from './src/const.mjs'
import { fetchKnownBlueskyDids } from './src/repos.mjs'
import fs from 'node:fs'

console.log('Fetching list of all known DIDs from', RELAY1_WEST)
const dids = await fetchKnownBlueskyDids(RELAY1_WEST, (n) =>
  console.log(n, 'DIDs fetched')
)
console.log('Fetch completed, writing to', REPOS_JSON)
fs.writeFileSync(
  REPOS_JSON,
  JSON.stringify({ createdAt: new Date().toISOString(), dids }),
  'utf8'
)
