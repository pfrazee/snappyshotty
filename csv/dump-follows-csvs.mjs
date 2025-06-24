import process from 'node:process'
import { join } from 'node:path'
import prettyBytes from 'pretty-bytes'
import { csvDumper } from '../lib/csv-dumper.mjs'
import {
  readDidsFile,
  readRepo,
  getRepoSize,
  getCollectionContents,
} from '../lib/repos.mjs'
import { csvWriter } from '../lib/csv.mjs'
import { CSVS_DIR } from '../lib/const.mjs'

const pid = `Worker-${process.pid}`

csvDumper(async (start, end, hit) => {
  let { dids } = await readDidsFile()
  console.log(pid, 'handling', start, 'through', end, 'of', dids.length)
  dids = dids.slice(start, end)

  const csv = csvWriter(join(CSVS_DIR, `follows-${start}-through-${end}.csv`), {
    header: true,
    columns: [
      { key: 'did', header: ':START_ID' },
      { key: 'subject', header: ':END_ID' },
    ],
  })
  for (let { did } of dids) {
    try {
      let repo
      try {
        const sz = await getRepoSize(did)
        console.error(pid, did, prettyBytes(sz))
        if (sz > 3e8) {
          // 300mb
          console.log(pid, 'skipping', did, 'due to carfile size')
          continue
        }
        repo = await readRepo(did)
      } catch (e) {
        console.error(pid, did, 'skipping, not available')
        hit()
        continue
      }
      const follows = Object.values(
        await getCollectionContents(repo, 'app.bsky.graph.follow')
      )
      for (const follow of Object.values(follows)) {
        csv.write({ did, subject: follow.subject })
      }
      console.error(pid, did, 'done,', follows.length, 'follows')
    } catch (e) {
      console.error(pid, did, 'failed:', e)
    }
    hit()
  }
  csv.on('finish', () => {
    console.log(pid, `follows-${start}-through-${end}.csv written`)
    process.exit(0)
  })
  csv.end()
})
