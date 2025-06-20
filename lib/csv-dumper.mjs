import { readDidsFile } from './repos.mjs'
import { RateMeter } from './rate.mjs'

export async function csvDumper(worker) {
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
}
