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

// main scheduler - resolves repo doc and subschedules car fetch
async function handleDid({ did }) {
  if (await isRepoDownloaded(did)) {
    console.error(did, 'downloaded, skipping')
    return
  }
  const { pds } = await resolveRepoDidDoc(did)
  console.error(did, 'resolved PDS to', pds)
  const pdsUrl = new URL(pds)

  const subscheduler = getScheduler(
    pdsUrl.hostname,
    { concurrency: 25, rateLimit: 25 }, // 25/s per PDS to avoid saturating the PDS and/or getting rate limited
    handleRepo
  )
  subscheduler.enqueue({ did, pds })
}

// repo fetch
async function handleRepo({ did, pds }) {
  try {
    await fetchRepoCarFile(did, pds)
    console.error(did, 'car file fetched')
  } catch (e) {
    console.error(did, 'car fetch failed', e)
  }
  rm.hit()
}

// kickoff
const scheduler = getScheduler(
  'main',
  { concurrency: 25, rateLimit: 25 },
  handleDid
)
scheduler.enqueue(dids)

// logging
function logStats() {
  const stats = Array.from(schedulers.entries()).map(([id, sched]) => [
    id,
    sched.getStats().active,
  ])
  console.table(stats)
  console.log(rm.statsStr())
}
setInterval(() => logStats(), 1e3).unref()
