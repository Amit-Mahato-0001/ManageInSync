const createHttpError = require("../utils/httpError")

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
    keyGenerator = getClientKey
}) => {
    const store = new Map()
    activeStores.add(store)
    startCleanupLoop()

    return (req, res, next) => {
        const now = Date.now()
        const key = keyGenerator(req)
        const entry = store.get(key)

        if (!entry || entry.resetAt <= now) {
            store.set(key, {
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
