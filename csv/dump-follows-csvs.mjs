import { readDidsFile } from '../lib/repos.mjs'
import { RateMeter } from '../lib/rate.mjs'
import { worker } from './dump-follows-csvs/worker.mjs'

const { dids } = await readDidsFile()
const rm = new RateMeter(dids.length)
console.log(dids.length, 'accounts to process')

runAsCluster(dids.length, worker, () => {
  rm.hit()
  if (rm.remaining === 0) {
    console.log('Job done!')
  }
})

// logging
setInterval(() => console.log(rm.statsStr()), 1e3).unref()
