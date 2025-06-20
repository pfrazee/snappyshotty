import fs from 'node:fs'
import { join } from 'node:path'
import { REPOS_DIR } from './const.mjs'

export async function fileExists(path) {
  try {
    const st = await fs.promises.stat(path)
    if (st) {
      return true
    }
  } catch {} /* doesnt exist, continue */
  return false
}

export async function touch(path) {
  return fs.promises.open(path, 'a').then((fh) => fh.close())
}

export async function listAll(path, ext) {
  const files = await fs.promises.readdir(path, { recursive: true })
  return files.filter((path) => path.endsWith(ext))
}

export async function listCachedRepoDids() {
  return (await listAll(REPOS_DIR, '.car')).map((path) =>
    path.split('/').pop().slice(0, -4)
  )
}

export function getCarPath /*y*/(did) {
  return join(REPOS_DIR, didDir(did), `${did}.car`)
}

export function getDnePath(did) {
  return join(REPOS_DIR, didDir(did), `${did}.dne`)
}

export function getDiddocPath(did) {
  return join(REPOS_DIR, didDir(did), `${did}.json`)
}

export function csvout(...params) {
  console.error(params.map((v) => String(v).replaceAll(',', '')).join(','))
}

function didDir(did) {
  const [_1, _2, str] = did.split(':')
  return str.slice(0, 2)
}
