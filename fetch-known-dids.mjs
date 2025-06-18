import { RELAY1_WEST } from './src/const.mjs'
import { fetchKnownBlueskyDids } from './src/repos.mjs'
import fs from 'node:fs'

console.log('Fetching list of all known DIDs from', RELAY1_WEST)
const dids = await fetchKnownBlueskyDids(RELAY1_WEST, (n) =>
  console.log(n, 'DIDs fetched')
)
console.log('Fetch completed, writing to ./.repos.json')
fs.writeFileSync(
  './.repos.json',
  JSON.stringify({ createdAt: new Date().toISOString(), dids }),
  'utf8'
)
