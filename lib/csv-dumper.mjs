import { readDidsFile } from './repos.mjs'
import { RateMeter } from './rate.mjs'
import { runAsCluster } from './cluster.mjs'

export async function csvDumper(worker) {
  const { dids } = await readDidsFile()
  const rm = new RateMeter(dids.length)

  runAsCluster(
    dids.length,
    () => {
      console.log(dids.length, 'accounts to process')
      setInterval(() => console.log(rm.statsStr()), 1e3).unref()
    },
    worker,
    () => {
      rm.hit()
      if (rm.remaining === 0) {
        console.log('Job done!')
      }
    }
  )
}
