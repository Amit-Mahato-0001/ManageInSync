const buildMessageRateLimit = ({ windowMs = 60000, max = 20 } = {}) => {

    const requestsByKey = new Map()

    return (req, res, next) => {

        const key = `${req.tenantId}:${req.user?._id}`
        const now = Date.now()
        const windowStart = now - windowMs

        const timestamps = requestsByKey.get(key) || []
        const activeTimestamps = timestamps.filter((time) => time > windowStart)

        if (activeTimestamps.length >= max) {
            
            return res.status(429).json({
                message: "Too many messages. Please wait a moment and try again."
            })
        }

        activeTimestamps.push(now)
        requestsByKey.set(key, activeTimestamps)
        next()
    }
}

module.exports = buildMessageRateLimit
