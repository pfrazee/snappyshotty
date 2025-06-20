import fs from 'node:fs'
import { stringify } from 'csv-stringify'

export function csvWriter(path, opts) {
  const ws = fs.createWriteStream(path, 'utf8')
  const csv = stringify(opts)
  csv.pipe(ws)
  return csv
}
