const { Worker } = require("bullmq")
const { loadEnvironment } = require("../config/env")
const { getQueueRedisConnection, shouldUseRedis } = require("../config/redis")
const { EMAIL_QUEUE_NAME, JOB_NAMES } = require("../queues/email.queue")
const { sendInviteEmail, sendPasswordResetEmail } = require("../utils/email")

loadEnvironment()

if (!shouldUseRedis()) {
    console.error("Email worker requires REDIS_URL")
    process.exit(1)
}

const worker = new Worker(
    EMAIL_QUEUE_NAME,
    async (job) => {
        if (job.name === JOB_NAMES.invite) {
            await sendInviteEmail(job.data)
            return
        }

        if (job.name === JOB_NAMES.passwordReset) {
            await sendPasswordResetEmail(job.data)
            return
        }

        throw new Error(`Unknown email job: ${job.name}`)
    },
    {
        connection: getQueueRedisConnection(),
        concurrency: Number(process.env.EMAIL_WORKER_CONCURRENCY) || 5
    }
)

worker.on("completed", (job) => {
    console.log(`Email job completed: ${job.id} (${job.name})`)
})

worker.on("failed", (job, error) => {
    console.error(`Email job failed: ${job?.id || "unknown"} (${job?.name || "unknown"})`, error.message)
})

const shutdown = async () => {
    console.log("Shutting down email worker")
    await worker.close()
    process.exit(0)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
