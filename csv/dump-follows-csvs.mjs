import process from 'node:process'
import { join } from 'node:path'
import { csvDumper } from '../lib/csv-dumper.mjs'
import { readDidsFile, readRepo } from '../lib/repos.mjs'
import { csvWriter } from '../lib/csv.mjs'
import { CSVS_DIR } from '../lib/const.mjs'

csvDumper(async (start, end, hit) => {
  let { dids } = await readDidsFile()
  console.log(
    'Worker',
    process.pid,
    'handling',
    start,
    'through',
    end,
    'of',
    dids.length
  )
  dids = dids.slice(start, end)

  const csv = csvWriter(join(CSVS_DIR, `follows-${process.pid}.csv`), {
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
        repo = await readRepo(did)
      } catch (e) {
        console.error(did, 'skipping, not available')
        hit()
        continue
      }
      const follows = Object.values(
        (await repo.getContents())['app.bsky.graph.follow']
      )
      for (const follow of Object.values(follows)) {
        csv.write({ did, subject: follow.subject })
      }
      console.error(did, 'done,', follows.length, 'follows')
    } catch (e) {
      console.error(did, 'failed:', e)
    }
    hit()
  }
  csv.on('finish', () => {
    console.log(`follows-${process.pid}.csv written`)
    process.exit(0)
  })
  csv.end()
})
