import { readDidsFile, fetchRepo } from './src/repos.mjs'

const { dids } = await readDidsFile()
console.log(dids.length, 'accounts to fetch')

for (let i = 0; i < 100; i++) {
  console.log(dids[i].did)
  await fetchRepo(dids[i].did, (msg) => console.log('\t', msg))
}
