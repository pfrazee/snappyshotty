import fs from 'node:fs'

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
