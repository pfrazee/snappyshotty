import { AtpAgent } from '@atproto/api'
import { readCarStream, MemoryBlockstore, Repo, BlockMap } from '@atproto/repo'
import { DidResolver } from '@atproto/identity'
import fs from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'
import { REPOS_JSON, REPOS_DIR, TASKS_DIR } from './const.mjs'
import { fileExists, touch } from './util.mjs'

const DL_STREAM_TO_DISK = true

const didres = new DidResolver({})

export async function readDidsFile() {
  return JSON.parse(await fs.promises.readFile(REPOS_JSON, 'utf8'))
}

export async function fetchKnownBlueskyDids(service, progressCb) {
  const agent = new AtpAgent({
    service,
  })
  let res
  let dids = []
  let cursor = undefined
  do {
    res = await agent.com.atproto.sync.listReposByCollection({
      collection: 'app.bsky.actor.profile',
      cursor,
    })
    cursor = res.data.cursor
    dids = dids.concat(res.data.repos)
    progressCb?.(dids.length)
  } while (cursor && res.data.repos.length)
  return dids
}

export async function isDidDocDownloaded(did) {
  return fileExists(path.join(REPOS_DIR, didDir(did), `${did}.json`))
}

export async function isRepoDownloaded(did) {
  if (await fileExists(path.join(REPOS_DIR, didDir(did), `${did}.car`))) {
    return true
  }
  if (await fileExists(path.join(REPOS_DIR, didDir(did), `${did}.dne`))) {
    return true
  }
  return false
}

export async function fetchDidDoc(did) {
  try {
    const doc = JSON.parse(
      await fs.promises.readFile(
        path.join(REPOS_DIR, didDir(did), `${did}.json`),
        'utf8'
      )
    )
    console.error(did, 'read did doc from cache')
    return doc
  } catch {}
  const doc = await didres.resolveAtprotoData(did)
  await fs.promises.writeFile(
    path.join(REPOS_DIR, didDir(did), `${did}.json`),
    JSON.stringify(doc),
    'utf8'
  )
  return doc
}

export async function fetchRepoCarFile(did, pds) {
  await fs.promises.mkdir(path.join(REPOS_DIR, didDir(did)), {
    recursive: true,
  })

  if (DL_STREAM_TO_DISK) {
    const url = new URL(pds)
    url.pathname = '/xrpc/com.atproto.sync.getRepo'
    url.searchParams.set('did', did)
    const res = await fetch(url)
    if (!res.ok) {
      if (res.status == 400) {
        /* dont await */ touch(path.join(REPOS_DIR, didDir(did), `${did}.dne`))
      }
      throw new Error(`received ${res.status} ${res.statusText}`)
    }
    Readable.fromWeb(res.body).pipe(
      fs.createWriteStream(path.join(REPOS_DIR, didDir(did), `${did}.car`))
    )
  } else {
    const agent = new AtpAgent({
      service: pds,
    })
    const res = await agent.com.atproto.sync.getRepo({
      did,
    })
    await fs.promises.writeFile(
      path.join(REPOS_DIR, didDir(did), `${did}.car`),
      res.data
    )
  }
}

export async function readRepo(did) {
  const rs = fs.createReadStream(
    path.join(REPOS_DIR, didDir(did), `${did}.car`)
  )

  const { roots, blocks } = await readCarStream(rs)
  if (roots.length !== 1) {
    throw new Error('expected one root')
  }

  const blockMap = new BlockMap()
  for await (const block of blocks) {
    blockMap.set(block.cid, block.bytes)
  }

  const storage = new MemoryBlockstore(blockMap)
  return await Repo.load(storage, roots[0])
}

export async function isRepoTaskDone(did, task) {
  try {
    await fs.promises.stat(path.join(TASKS_DIR, task, didDir(did), did))
    return true
  } catch {
    return false
  }
}

export function setRepoTaskDone(did, task) {
  /* dont await */ fs.promises
    .mkdir(path.join(TASKS_DIR, task, didDir(did)), { recursive: true })
    .then(() => touch(path.join(TASKS_DIR, task, didDir(did), did), 'a'))
}

function didDir(did) {
  const [_1, _2, str] = did.split(':')
  return str.slice(0, 2)
}
