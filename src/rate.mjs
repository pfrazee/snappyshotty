export class RateMeter {
  lastHit = undefined
  hits = []
  remaining = 0

  constructor(total) {
    this.remaining = total
  }

  hit() {
    this.remaining--
    if (this.lastHit) {
      this.hits.push(Date.now() - this.lastHit)
      if (this.hits.length > 200) {
        this.hits = this.hits.slice(50)
      }
    }
    this.lastHit = Date.now()
  }

  stats() {
    const ms = (this.hits.reduce((acc, v) => acc + v, 0) / this.hits.length) | 0
    const hpm = ((1 / ms) * 60e3) | 0
    const est = (this.remaining / hpm) | 0
    return { ms, hpm, est }
  }

  statsStr() {
    const { est, hpm } = this.stats()
    return `${this.remaining} repos left | ${est}min remaining | ${hpm}pm`
  }
}
