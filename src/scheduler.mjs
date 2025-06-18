const DONE = Symbol('done')

export class Scheduler {
  concurrency = 1
  handler = () => {}
  queue = []
  queueIndex = 0
  tasks = []

  constructor(opts, handler) {
    this.concurrency = opts.concurrency
    this.handler = handler
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
      if (!this.tasks[i]) {
        const nextParam = this.#nextParam()
        if (nextParam === DONE) {
          return
        }
        this.tasks[i] = this.#runTask(i, nextParam)
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
}
