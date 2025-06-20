import { readDidsFile } from '../lib/repos.mjs'
import { getDiddocPath } from '../lib/util.mjs'
import { schedule } from '../lib/scheduler.mjs'
import { RateMeter } from '../lib/rate.mjs'
import { csvWriter } from '../lib/csv.mjs'
import { CSVS_DIR } from '../lib/const.mjs'
import path from 'node:path'

const { dids } = await readDidsFile()
const rm = new RateMeter(dids.length)
console.log(dids.length, 'accounts to emit')

const csv = csvWriter(path.join(CSVS_DIR, 'users.csv'), {
  header: true,
  columns: [{ key: 'did', header: 'did:ID' }, { key: 'handle' }],
})
schedule(dids, { concurrency: 1000 }, async ({ did }) => {
  try {
    const doc = JSON.parse(
      await fs.promises.readFile(getDiddocPath(did), 'utf8')
    )
    csv.write({ did, handle: doc.handle || 'invalid.handle' })
  } catch {}
}).on('done', () => csv.end())
csv.on('finish', () => {
  console.log('users.csv written')
  process.exit(0)
})

// logging
setInterval(() => console.log(rm.statsStr()), 1e3).unref()
