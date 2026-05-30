const { Queue } = require("bullmq")
const { getQueueRedisConnection, shouldUseRedis } = require("../config/redis")
const { sendInviteEmail, sendPasswordResetEmail } = require("../utils/email")

const EMAIL_QUEUE_NAME = "email"
const JOB_NAMES = {
    invite: "invite",
    passwordReset: "password-reset"
}

let emailQueue = null

const getEmailQueue = () => {
    if (!shouldUseRedis()) {
        return null
    }

    if (!emailQueue) {
        emailQueue = new Queue(EMAIL_QUEUE_NAME, {
            connection: getQueueRedisConnection(),
            defaultJobOptions: {
                attempts: Number(process.env.EMAIL_QUEUE_ATTEMPTS) || 3,
                backoff: {
                    type: "exponential",
                    delay: Number(process.env.EMAIL_QUEUE_BACKOFF_MS) || 5000
                },
                removeOnComplete: {
                    age: Number(process.env.EMAIL_QUEUE_COMPLETED_TTL_SECONDS) || 3600
                },
                removeOnFail: {
                    age: Number(process.env.EMAIL_QUEUE_FAILED_TTL_SECONDS) || 7 * 24 * 3600
                }
            }
        })
    }

    return emailQueue
}

const enqueueInviteEmail = async (payload) => {
    const queue = getEmailQueue()

    if (!queue) {
        await sendInviteEmail(payload)
        return
    }

    await queue.add(JOB_NAMES.invite, payload)
}

const enqueuePasswordResetEmail = async (payload) => {
    const queue = getEmailQueue()

    if (!queue) {
        await sendPasswordResetEmail(payload)
        return
    }

    await queue.add(JOB_NAMES.passwordReset, payload)
}

const closeEmailQueue = async () => {
    if (!emailQueue) {
        return
    }

    await emailQueue.close()
    emailQueue = null
}

module.exports = {
    EMAIL_QUEUE_NAME,
    JOB_NAMES,
    closeEmailQueue,
    enqueueInviteEmail,
    enqueuePasswordResetEmail
}
