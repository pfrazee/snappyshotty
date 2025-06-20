import cluster from 'node:cluster'
import os from 'node:os'
import process from 'node:process'

const numCPUs = os.availableParallelism()

export function runAsCluster(numTasks, taskCb, handleHitCb) {
  if (cluster.isPrimary) {
    console.log(
      `Primary ${process.pid} is online; spawning ${numCPUs} worker processes`
    )

    cluster.on('message', handleHitCb)

    // Fork workers.
    const numWorkerTasks = (numTasks / numCPUs) | 0
    for (let i = 0; i < numCPUs; i++) {
      // last worker picks up the additional tasks in non-evenly-divisible workloads
      const length =
        i === numCPUs - 1
          ? numTasks - numWorkerTasks * (numCPUs - 1)
          : numWorkerTasks
      cluster.fork({
        WORKER_START: i * numWorkerTasks,
        WORKER_END: i * numWorkerTasks + length,
      })
    }

    cluster.on('exit', (worker, code, signal) => {
      console.log(`worker ${worker.process.pid} closed`)
      if (Object.values(cluster.workers).length === 0) {
        process.exit(0)
      }
    })
  } else {
    taskCb(+process.env.WORKER_START, +process.env.WORKER_END, () =>
      process.send({})
    )
  }
}
