import process from 'node:process'
import { readDidsFile } from '../../src/repos.mjs'
import { csvWriter } from '../../src/csv.mjs'
import { CSVS_DIR } from '../../src/const.mjs'
import { schedule } from '../../src/scheduler.mjs'

export async function worker(start, end, hit) {
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

  const csv = csvWriter(path.join(CSVS_DIR, `follows-${process.pid}.csv`), {
    header: true,
    columns: [
      { key: 'did', header: ':START_ID' },
      { key: 'subject', header: ':END_ID' },
    ],
  })
  schedule(dids, { concurrency: 100 }, async ({ did }) => {
    try {
      const repo = await readRepo(did)
      await setRepoTaskDone(did, 'follows')
      const follows = (await repo.getContents())['app.bsky.graph.follow']
      for (const follow of Object.values(follows)) {
        console.log('\t', follow.subject)
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
}
