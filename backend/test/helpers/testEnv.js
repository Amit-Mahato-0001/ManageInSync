const path = require("path")

const BACKEND_SRC_FRAGMENT = `${path.sep}backend${path.sep}src${path.sep}`

const buildTestEnv = (overrides = {}) => ({
    NODE_ENV: "test",
    PORT: "3000",
    MONGO_URI: "mongodb://localhost:27017/manageinsync-test",
    FRONTEND_URL: "https://app.manageinsync.test",
    ACCESS_TOKEN_SECRET: "a".repeat(32),
    JWT_SECRET: "b".repeat(32),
    ACCESS_TOKEN_TTL: "15m",
    REFRESH_TOKEN_TTL_MS: "604800000",
    REFRESH_TOKEN_COOKIE_NAME: "refreshToken",
    REFRESH_TOKEN_COOKIE_PATH: "/api/auth",
    REFRESH_TOKEN_SAME_SITE: "strict",
    JSON_BODY_LIMIT: "100kb",
    GENERAL_RATE_LIMIT_WINDOW_MS: "60000",
    GENERAL_RATE_LIMIT_MAX: "240",
    AUTH_RATE_LIMIT_WINDOW_MS: "600000",
    AUTH_RATE_LIMIT_MAX: "20",
    INVITE_RATE_LIMIT_WINDOW_MS: "600000",
    INVITE_RATE_LIMIT_MAX: "20",
    BILLING_RATE_LIMIT_WINDOW_MS: "300000",
    BILLING_RATE_LIMIT_MAX: "60",
    ...overrides
})

const applyTestEnvironment = (overrides = {}) => {
    const snapshot = {
        ...process.env
    }
    const nextEnv = buildTestEnv(overrides)

    for (const key of Object.keys(process.env)) {
        delete process.env[key]
    }

    Object.assign(process.env, nextEnv)

    return () => {
        for (const key of Object.keys(process.env)) {
            delete process.env[key]
        }

        Object.assign(process.env, snapshot)
    }
}

const clearBackendModuleCache = () => {
    for (const modulePath of Object.keys(require.cache)) {
        if (modulePath.includes(BACKEND_SRC_FRAGMENT)) {
            delete require.cache[modulePath]
        }
    }
}

module.exports = {
    applyTestEnvironment,
    buildTestEnv,
    clearBackendModuleCache
}
