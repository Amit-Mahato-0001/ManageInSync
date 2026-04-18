const assert = require("node:assert/strict")
const { buildTestEnv } = require("./helpers/testEnv")

const { validateEnvironment } = require("../src/config/env")

const createValidEnv = () =>
    buildTestEnv({
        NODE_ENV: "production",
        FRONTEND_URL: "https://app.manageinsync.com",
        EMAIL_HOST: "smtp.manageinsync.dev",
        EMAIL_PORT: "587",
        EMAIL_USER: "ops@manageinsync.dev",
        EMAIL_PASS: "mail-password",
        EMAIL_SECURE: "false",
        EMAIL_REQUIRE_TLS: "true"
    })

assert.doesNotThrow(() => {
    validateEnvironment(createValidEnv())
})

assert.throws(
    () =>
        validateEnvironment({
            ...createValidEnv(),
            MONGO_URI: ""
        }),
    /MONGO_URI is required/
)

assert.throws(
    () =>
        validateEnvironment({
            ...createValidEnv(),
            ACCESS_TOKEN_SECRET: "",
            JWT_SECRET: ""
        }),
    /ACCESS_TOKEN_SECRET or JWT_SECRET is required/
)

assert.throws(
    () =>
        validateEnvironment({
            ...createValidEnv(),
            FRONTEND_URL: "https://app.manageinsync.com/dashboard"
        }),
    /FRONTEND_URL must be an origin only/
)

assert.throws(
    () =>
        validateEnvironment({
            ...createValidEnv(),
            EMAIL_PASS: ""
        }),
    /EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS are required in production/
)

assert.throws(
    () =>
        validateEnvironment({
            ...createValidEnv(),
            RAZORPAY_KEY_ID: "rzp_test_demo",
            RAZORPAY_KEY_SECRET: ""
        }),
    /Razorpay configuration must be configured as a complete set/
)

assert.throws(
    () =>
        validateEnvironment({
            ...createValidEnv(),
            EMAIL_SECURE: "maybe"
        }),
    /EMAIL_SECURE must be either true or false/
)

assert.throws(
    () =>
        validateEnvironment({
            ...createValidEnv(),
            CORS_ALLOWED_ORIGINS: "https://allowed.example.com,https://another.example.com/path"
        }),
    /CORS_ALLOWED_ORIGINS must be an origin only/
)

console.log("Environment validation tests passed")
