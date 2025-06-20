import process from 'node:process'
import { join } from 'node:path'
import { csvDumper } from '../lib/csv-dumper.mjs'
import { readDidsFile } from '../lib/repos.mjs'
import { csvWriter } from '../lib/csv.mjs'
import { CSVS_DIR } from '../lib/const.mjs'
import { schedule } from '../lib/scheduler.mjs'

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
  schedule(dids, { concurrency: 100 }, async ({ did }) => {
    try {
      const repo = await readRepo(did)
      const follows = (await repo.getContents())['app.bsky.graph.follow']
      for (const follow of Object.values(follows)) {
        csv.write({ did, subject: follow.subject })
      }
      console.error(did, 'done,', follows.length, 'follows')
      hit()
    } catch (e) {
      console.error(did, 'failed:', e)
    }
  }).on('done', () => csv.end())
  csv.on('finish', () => {
    console.log(`follows-${process.pid}.csv written`)
    process.exit(0)
  })
})
