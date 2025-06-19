const DONE = Symbol('done')

export class Scheduler {
  concurrency = 1
  rateLimit = 0
  handler = () => {}
  queue = []
  queueIndex = 0
  tasks = []
  rlCounter = 0

  constructor(opts, handler) {
    this.concurrency = opts.concurrency || 1
    this.rateLimit = opts.rateLimit || 0
    this.handler = handler
    if (this.rateLimit) {
      setInterval(this.#tickRateLimiter.bind(this), 1e3)
    }
  }

  enqueue(param) {
    if (Array.isArray(param)) {
      this.queue = this.queue.concat(param)
    } else {
      this.queue.push(param)
    }
    this.#flush()
  }

  getStats() {
    return { active: this.tasks.filter(Boolean).length }
  }

  #flush() {
    for (let i = 0; i < this.concurrency; i++) {
      if (this.rateLimit && this.rlCounter >= this.rateLimit) {
        return
      }
      if (!this.tasks[i]) {
        const nextParam = this.#nextParam()
        if (nextParam === DONE) {
          return
        }
        this.tasks[i] = this.#runTask(i, nextParam)
        this.rlCounter++
      }
    }
  }

  #nextParam() {
    if (this.queueIndex < this.queue.length) {
      return this.queue[this.queueIndex++]
    }
    return DONE
  }

  #runTask(i, param) {
    return this.handler(param)
      .catch((e) => console.error(e))
      .then(() => {
        this.tasks[i] = undefined
        this.#flush()
      })
  }

  #tickRateLimiter() {
    this.rlCounter = 0
    this.#flush()
  }
}
