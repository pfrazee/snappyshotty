export class RateMeter {
  ticks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ti = 0
  counter = 0
  remaining = 0

  constructor(total) {
    this.remaining = total
    setInterval(this.#tick.bind(this), 1e3).unref()
  }

  hit() {
    this.remaining--
    this.counter++
  }

  #tick() {
    this.ticks[this.ti++] = this.counter
    if (this.ti >= 10) this.ti = 0
    this.counter = 0
  }

  stats() {
    const hps =
      (this.ticks.reduce((acc, v) => acc + v, 0) / this.ticks.length) | 0
    const est = (this.remaining / hps) | 0
    return { hps, est }
  }

  statsStr() {
    const { est, hps } = this.stats()
    if (est > 60) {
      return `${this.remaining} repos left | ${
        (est / 60) | 0
      }min remaining | ${hps}ps`
    }
    return `${this.remaining} repos left | ${est}s remaining | ${hps}ps`
  }
}
