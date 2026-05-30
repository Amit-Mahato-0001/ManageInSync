const { createRateLimiter } = require("./rateLimit.middleware")

const buildMessageRateLimit = ({ windowMs = 60000, max = 20 } = {}) =>
    createRateLimiter({
        windowMs,
        max,
        message: "Too many messages. Please wait a moment and try again.",
        code: "message_rate_limit_exceeded",
        prefix: "messages",
        keyGenerator: (req) => `${req.tenantId}:${req.user?._id}`
    })

module.exports = buildMessageRateLimit
