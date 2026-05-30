const IORedis = require("ioredis")

let redisClient = null
let queueRedisConnection = null

const getRedisUrl = () => process.env.REDIS_URL?.trim()

const shouldUseRedis = () => Boolean(getRedisUrl())

const buildRedisOptions = () => ({
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true
})

const createRedisConnection = () =>
    new IORedis(getRedisUrl(), buildRedisOptions())

const getRedisClient = () => {
    if (!shouldUseRedis()) {
        return null
    }

    if (!redisClient) {
        redisClient = createRedisConnection()
        redisClient.on("error", (error) => {
            console.error("Redis client error:", error.message)
        })
    }

    return redisClient
}

const getQueueRedisConnection = () => {
    if (!shouldUseRedis()) {
        return null
    }

    if (!queueRedisConnection) {
        queueRedisConnection = createRedisConnection()
        queueRedisConnection.on("error", (error) => {
            console.error("Redis queue connection error:", error.message)
        })
    }

    return queueRedisConnection
}

const closeRedisConnections = async () => {
    const connections = [redisClient, queueRedisConnection].filter(Boolean)

    redisClient = null
    queueRedisConnection = null

    await Promise.all(
        connections.map((connection) => connection.quit().catch(() => connection.disconnect()))
    )
}

module.exports = {
    closeRedisConnections,
    getQueueRedisConnection,
    getRedisClient,
    shouldUseRedis
}
