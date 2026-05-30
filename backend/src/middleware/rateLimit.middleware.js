const createHttpError = require("../utils/httpError")
const { getRedisClient, shouldUseRedis } = require("../config/redis")

const activeStores = new Set()
let cleanupInterval = null

const startCleanupLoop = () => {
    if (cleanupInterval) {
        return
    }

    cleanupInterval = setInterval(() => {
        const now = Date.now()

        activeStores.forEach((store) => {
            for (const [key, entry] of store.entries()) {
                if (entry.resetAt <= now) {
                    store.delete(key)
                }
            }
        })

        if (activeStores.size === 0) {
            clearInterval(cleanupInterval)
            cleanupInterval = null
        }
    }, 30 * 1000)

    if (typeof cleanupInterval.unref === "function") {
        cleanupInterval.unref()
    }
}

const getClientKey = (req) => {
    if (req.ip) {
        return req.ip
    }

    const forwardedFor = req.headers?.["x-forwarded-for"]

    if (typeof forwardedFor === "string" && forwardedFor.trim()) {
        return forwardedFor.split(",")[0].trim()
    }

    return req.socket?.remoteAddress || "unknown"
}

const createRateLimiter = ({
    windowMs,
    max,
    message,
    code = "rate_limit_exceeded",
    prefix = code,
    keyGenerator = getClientKey
}) => {
    const store = new Map()

    if (!shouldUseRedis()) {
        activeStores.add(store)
        startCleanupLoop()
    }

    return async (req, res, next) => {
        const now = Date.now()
        const key = keyGenerator(req)
        const storeKey = `rate-limit:${prefix}:${key}`

        if (shouldUseRedis()) {
            try {
                const redis = getRedisClient()
                const count = await redis.incr(storeKey)

                if (count === 1) {
                    await redis.pexpire(storeKey, windowMs)
                }

                let ttl = await redis.pttl(storeKey)

                if (ttl < 0) {
                    ttl = windowMs
                    await redis.pexpire(storeKey, windowMs)
                }

                const resetAt = Date.now() + ttl

                setRateLimitHeaders({
                    res,
                    limit: max,
                    remaining: Math.max(max - count, 0),
                    resetAt
                })

                if (count > max) {
                    next(createHttpError(message, 429, code))
                    return
                }

                next()
                return
            } catch (error) {
                next(error)
                return
            }
        }

        const entry = store.get(storeKey)

        if (!entry || entry.resetAt <= now) {
            store.set(storeKey, {
                count: 1,
                resetAt: now + windowMs
            })
            setRateLimitHeaders({
                res,
                limit: max,
                remaining: Math.max(max - 1, 0),
                resetAt: now + windowMs
            })
            next()
            return
        }

        entry.count += 1

        setRateLimitHeaders({
            res,
            limit: max,
            remaining: Math.max(max - entry.count, 0),
            resetAt: entry.resetAt
        })

        if (entry.count > max) {
            next(createHttpError(message, 429, code))
            return
        }

        next()
    }
}

const setRateLimitHeaders = ({ res, limit, remaining, resetAt }) => {
    const retryAfterSeconds = Math.max(
        0,
        Math.ceil((resetAt - Date.now()) / 1000)
    )

    res.setHeader("RateLimit-Limit", String(limit))
    res.setHeader("RateLimit-Remaining", String(remaining))
    res.setHeader("RateLimit-Reset", String(retryAfterSeconds))

    if (remaining === 0) {
        res.setHeader("Retry-After", String(retryAfterSeconds))
    }
}

module.exports = {
    createRateLimiter
}
