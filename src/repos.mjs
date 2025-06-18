import { AtpAgent } from '@atproto/api'
import { readCarStream, MemoryBlockstore, Repo, BlockMap } from '@atproto/repo'
import { DidResolver } from '@atproto/identity'
import fs from 'node:fs'
import { Readable } from 'node:stream'

const DL_STREAM_TO_DISK = true

const didres = new DidResolver({})

export async function readDidsFile() {
  return JSON.parse(await fs.promises.readFile('./.repos.json', 'utf8'))
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

export async function isRepoDownloaded(did) {
  try {
    const st = await fs.promises.stat(`./.repos/${didDir(did)}/${did}.car`)
    if (st) {
      return true
    }
  } catch {} /* doesnt exist, continue */
  return false
}

export async function resolveRepoDidDoc(did) {
  return await didres.resolveAtprotoData(did)
}

export async function fetchRepoCarFile(did, pds) {
  await fs.promises.mkdir(`./.repos/${didDir(did)}`, { recursive: true })

  if (DL_STREAM_TO_DISK) {
    const url = new URL(pds)
    url.pathname = '/xrpc/com.atproto.sync.getRepo'
    url.searchParams.set('did', did)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`received ${res.status} ${res.statusText}`)
    Readable.fromWeb(res.body).pipe(
      fs.createWriteStream(`./.repos/${didDir(did)}/${did}.car`)
    )
  } else {
    const agent = new AtpAgent({
      service: pds,
    })
    const res = await agent.com.atproto.sync.getRepo({
      did,
    })
    await fs.promises.writeFile(`./.repos/${didDir(did)}/${did}.car`, res.data)
  }
}

export async function fetchRepo(did, progressCb) {
  try {
    const st = await fs.promises.stat(`./.repos/${didDir(did)}/${did}.car`)
    if (st) {
      progressCb?.(`already downloaded`)
      return
    }
  } catch {} /* doesnt exist, continue */

  let doc
  try {
    doc = await didres.resolveAtprotoData(did)
    progressCb?.(`resolved did doc, pds is ${doc.pds}`)
  } catch (e) {
    progressCb?.(`failed to resolve did doc: ${e.toString()}`)
    return
  }

  await fs.promises.mkdir(`./.repos/${didDir(did)}`, { recursive: true })

  if (DL_STREAM_TO_DISK) {
    try {
      const url = new URL(doc.pds)
      url.pathname = '/xrpc/com.atproto.sync.getRepo'
      url.searchParams.set('did', did)
      const res = await fetch(url)
      if (!res.ok) throw new Error(`received ${res.status} ${res.statusText}`)
      Readable.fromWeb(res.body).pipe(
        fs.createWriteStream(`./.repos/${didDir(did)}/${did}.car`)
      )
      progressCb?.(`fetched car file, wrote to disk`)
    } catch (e) {
      progressCb?.(`failed to fetch repo: ${e.toString()}`)
    }
  } else {
    const agent = new AtpAgent({
      service: doc.pds,
    })
    let res
    try {
      res = await agent.com.atproto.sync.getRepo({
        did,
      })
      progressCb?.(`fetched car file, writing to disk`)
    } catch (e) {
      progressCb?.(`failed to fetch repo: ${e.toString()}`)
      return
    }
    await fs.promises.writeFile(`./.repos/${didDir(did)}/${did}.car`, res.data)
  }
}

export async function readRepo(did) {
  const rs = fs.createReadStream(`./.repos/${didDir(did)}/${did}.car`)

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
    await fs.promises.stat(`./.tasks/${task}/${didDir(did)}/${did}`)
    return true
  } catch {
    return false
  }
}

export function setRepoTaskDone(did, task) {
  fs.promises
    .mkdir(`./.tasks/${task}/${didDir(did)}`, { recursive: true })
    .then(() => fs.promises.open(`./.tasks/${task}/${didDir(did)}/${did}`, 'a'))
    .then((fh) => fh.close())
}

function didDir(did) {
  const [_1, _2, str] = did.split(':')
  return str.slice(0, 2)
}
