import pMap from 'p-map'
import {
  readDidsFile,
  readRepo,
  isRepoTaskDone,
  setRepoTaskDone,
} from './src/repos.mjs'
import { RateMeter } from './src/rate.mjs'
import { runAsCluster } from './src/cluster.mjs'

const rm = new RateMeter(1000)
runAsCluster(
  1000,
  async (start, end, hitCb) => {
    let { dids } = await readDidsFile()
    dids = dids.slice(start, end)
    console.log(dids.length, 'accounts to query')

    async function emitFollows({ did }) {
      try {
        const done = await isRepoTaskDone(did, 'follows')
        if (!done) {
          const repo = await readRepo(did)
          await setRepoTaskDone(did, 'follows')
          // const follows = (await repo.getContents())['app.bsky.graph.follow']
          // for (const follow of Object.values(follows)) {
          //   console.log('\t', follow.subject)
          // }
        }
      } catch {}
      hitCb?.()
    }

    await pMap(dids, emitFollows, { concurrency: 50 })
  },
  () => {
    rm.hit()
    const { ms, hpm, est } = rm.stats()
    console.log(
      rm.remaining,
      'repos left |',
      est,
      'minutes remaining |',
      hpm,
      'RPM |',
      ms,
      'avg ms'
    )
    if (rm.remaining === 0) {
      console.log('Job done!')
      process.exit()
    }
  }
)
