import {
  readDidsFile,
  isRepoDownloaded,
  resolveRepoDidDoc,
  fetchRepoCarFile,
} from './src/repos.mjs'
import { Scheduler } from './src/scheduler.mjs'
import { RateMeter } from './src/rate.mjs'

// scheduler management
const schedulers = new Map()
function getScheduler(id, opts, handler) {
  if (!schedulers.has(id)) {
    schedulers.set(id, new Scheduler(opts, handler))
  }
  return schedulers.get(id)
}

// fetch dids to index
const { dids } = await readDidsFile()
const rm = new RateMeter(dids.length)
console.log(dids.length, 'accounts to fetch')

async function scheduleRepo(repo) {
  if (await isRepoDownloaded(repo.did)) {
    console.error(repo.did, 'downloaded, skipping')
    return
  }
  didResolveSched.enqueue(repo)
}

async function resolveDid({ did }) {
  try {
    const { pds } = await resolveRepoDidDoc(did)
    console.error(did, 'resolved PDS to', pds)
    const pdsUrl = new URL(pds)

    const repoSched = getScheduler(
      pdsUrl.hostname,
      { concurrency: 25, rateLimit: 25 }, // 25/s per PDS to avoid saturating the PDS and/or getting rate limited
      fetchRepo
    )
    repoSched.enqueue({ did, pds })
  } catch (e) {
    console.error(did, 'did resolve failed', e)
  }
}

async function fetchRepo({ did, pds }) {
  try {
    await fetchRepoCarFile(did, pds)
    console.error(did, 'car file fetched')
  } catch (e) {
    console.error(did, 'car fetch failed', e)
  }
  rm.hit()
}

// kickoff
const mainSched = getScheduler(
  'main',
  { concurrency: 1000, rateLimit: 0 },
  scheduleRepo
)
const didResolveSched = getScheduler(
  'did-resolve',
  { concurrency: 25, rateLimit: 100 },
  resolveDid
)
mainSched.enqueue(dids)

// logging
function logStats() {
  const stats = Array.from(schedulers.entries()).map(([id, sched]) => [
    id,
    sched.getStats().active,
    sched.queueIndex,
  ])
  console.table(stats)
  console.log(rm.statsStr())
}
setInterval(() => logStats(), 1e3).unref()
