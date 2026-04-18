const fs = require("fs")
const path = require("path")
const dotenv = require("dotenv")

const ENV_PATH = path.resolve(__dirname, "../../.env")
const VALID_NODE_ENVS = new Set(["development", "test", "production"])
const VALID_SAME_SITE_VALUES = new Set(["strict", "lax", "none"])
const VALID_BOOLEAN_VALUES = new Set(["true", "false"])
const PLACEHOLDER_VALUES = new Set([
    "replace-me",
    "your-email@example.com",
    "smtp.example.com"
])

const readTrimmedValue = (env, key) =>
    typeof env[key] === "string" ? env[key].trim() : ""

const hasValue = (env, key) => readTrimmedValue(env, key) !== ""

const isPlaceholderValue = (value = "") => PLACEHOLDER_VALUES.has(value)

const ensureIntegerInRange = ({ label, value, minimum, maximum, issues }) => {
    const parsedValue = Number(value)

    if (
        !Number.isInteger(parsedValue) ||
        parsedValue < minimum ||
        parsedValue > maximum
    ) {
        issues.push(`${label} must be an integer between ${minimum} and ${maximum}`)
    }
}

const validateOriginUrl = ({ env, key, issues }) => {
    const value = readTrimmedValue(env, key)

    if (!value) {
        issues.push(`${key} is required`)
        return
    }

    let parsedUrl

    try {
        parsedUrl = new URL(value)
    } catch (error) {
        issues.push(`${key} must be a valid http or https URL`)
        return
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        issues.push(`${key} must use http or https`)
    }

    if (
        (parsedUrl.pathname && parsedUrl.pathname !== "/") ||
        parsedUrl.search ||
        parsedUrl.hash
    ) {
        issues.push(`${key} must be an origin only and must not include a path, query, or hash`)
    }
}

const validateOptionalOriginList = ({ env, key, issues }) => {
    const value = readTrimmedValue(env, key)

    if (!value) {
        return
    }

    const origins = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)

    if (origins.length === 0) {
        issues.push(`${key} must contain at least one origin when provided`)
        return
    }

    origins.forEach((origin) => {
        validateOriginUrl({
            env: {
                [key]: origin
            },
            key,
            issues
        })
    })
}

const validateBooleanValue = ({ env, key, issues }) => {
    const value = readTrimmedValue(env, key).toLowerCase()

    if (!value) {
        return
    }

    if (!VALID_BOOLEAN_VALUES.has(value)) {
        issues.push(`${key} must be either true or false`)
    }
}

const validateSecretValue = ({
    env,
    key,
    issues,
    minimumLength = 0
}) => {
    const value = readTrimmedValue(env, key)

    if (!value) {
        return
    }

    if (isPlaceholderValue(value)) {
        issues.push(`${key} must be replaced with a real secret`)
        return
    }

    if (minimumLength > 0 && value.length < minimumLength) {
        issues.push(`${key} must be at least ${minimumLength} characters long`)
    }
}

const validateConfigGroup = ({
    env,
    keys,
    groupLabel,
    issues,
    required = false,
    productionMessage
}) => {
    const presentKeys = keys.filter((key) => hasValue(env, key))
    const missingKeys = keys.filter((key) => !hasValue(env, key))

    if (!required && presentKeys.length === 0) {
        return false
    }

    if (missingKeys.length > 0) {
        if (required && productionMessage) {
            issues.push(productionMessage)
        } else {
            issues.push(
                `${groupLabel} must be configured as a complete set. Missing: ${missingKeys.join(", ")}`
            )
        }

        return false
    }

    return true
}

const buildValidationError = (issues) => {
    const error = new Error(
        `Invalid environment configuration:\n- ${issues.join("\n- ")}`
    )

    error.code = "invalid_environment"
    error.issues = issues

    return error
}

const validateEnvironment = (env = process.env) => {
    const issues = []
    const nodeEnv = readTrimmedValue(env, "NODE_ENV") || "development"
    const accessTokenSecret = readTrimmedValue(env, "ACCESS_TOKEN_SECRET")
    const jwtSecret = readTrimmedValue(env, "JWT_SECRET")

    if (!VALID_NODE_ENVS.has(nodeEnv)) {
        issues.push("NODE_ENV must be one of: development, test, production")
    }

    if (hasValue(env, "PORT")) {
        ensureIntegerInRange({
            label: "PORT",
            value: readTrimmedValue(env, "PORT"),
            minimum: 1,
            maximum: 65535,
            issues
        })
    }

    const mongoUri = readTrimmedValue(env, "MONGO_URI")

    if (!mongoUri) {
        issues.push("MONGO_URI is required")
    } else if (
        !mongoUri.startsWith("mongodb://") &&
        !mongoUri.startsWith("mongodb+srv://")
    ) {
        issues.push("MONGO_URI must start with mongodb:// or mongodb+srv://")
    }

    validateOriginUrl({
        env,
        key: "FRONTEND_URL",
        issues
    })
    validateOptionalOriginList({
        env,
        key: "CORS_ALLOWED_ORIGINS",
        issues
    })

    if (!accessTokenSecret && !jwtSecret) {
        issues.push("ACCESS_TOKEN_SECRET or JWT_SECRET is required")
    }

    validateSecretValue({
        env,
        key: "ACCESS_TOKEN_SECRET",
        issues,
        minimumLength: 32
    })
    validateSecretValue({
        env,
        key: "JWT_SECRET",
        issues,
        minimumLength: 32
    })

    if (
        Object.prototype.hasOwnProperty.call(env, "ACCESS_TOKEN_TTL") &&
        !readTrimmedValue(env, "ACCESS_TOKEN_TTL")
    ) {
        issues.push("ACCESS_TOKEN_TTL must not be empty")
    }

    if (hasValue(env, "REFRESH_TOKEN_TTL_MS")) {
        ensureIntegerInRange({
            label: "REFRESH_TOKEN_TTL_MS",
            value: readTrimmedValue(env, "REFRESH_TOKEN_TTL_MS"),
            minimum: 1,
            maximum: Number.MAX_SAFE_INTEGER,
            issues
        })
    }

    const refreshTokenCookiePath = readTrimmedValue(env, "REFRESH_TOKEN_COOKIE_PATH")

    if (refreshTokenCookiePath && !refreshTokenCookiePath.startsWith("/")) {
        issues.push("REFRESH_TOKEN_COOKIE_PATH must start with /")
    }

    const sameSiteValue = readTrimmedValue(env, "REFRESH_TOKEN_SAME_SITE").toLowerCase()

    if (sameSiteValue && !VALID_SAME_SITE_VALUES.has(sameSiteValue)) {
        issues.push("REFRESH_TOKEN_SAME_SITE must be one of: strict, lax, none")
    }

    const cookieDomain = readTrimmedValue(env, "COOKIE_DOMAIN")

    if (
        cookieDomain &&
        (cookieDomain.includes("://") || cookieDomain.includes("/") || cookieDomain.includes(" "))
    ) {
        issues.push("COOKIE_DOMAIN must be a domain only and must not include a protocol or path")
    }

    validateBooleanValue({
        env,
        key: "TRUST_PROXY",
        issues
    })
    validateBooleanValue({
        env,
        key: "EMAIL_SECURE",
        issues
    })
    validateBooleanValue({
        env,
        key: "EMAIL_REQUIRE_TLS",
        issues
    })

    if (
        Object.prototype.hasOwnProperty.call(env, "JSON_BODY_LIMIT") &&
        !readTrimmedValue(env, "JSON_BODY_LIMIT")
    ) {
        issues.push("JSON_BODY_LIMIT must not be empty")
    }

    const hasEmailConfig = validateConfigGroup({
        env,
        keys: ["EMAIL_HOST", "EMAIL_PORT", "EMAIL_USER", "EMAIL_PASS"],
        groupLabel: "Email configuration",
        issues,
        required: nodeEnv === "production",
        productionMessage:
            "EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS are required in production"
    })

    if (hasEmailConfig) {
        ensureIntegerInRange({
            label: "EMAIL_PORT",
            value: readTrimmedValue(env, "EMAIL_PORT"),
            minimum: 1,
            maximum: 65535,
            issues
        })

        validateSecretValue({
            env,
            key: "EMAIL_HOST",
            issues
        })
        validateSecretValue({
            env,
            key: "EMAIL_USER",
            issues
        })
        validateSecretValue({
            env,
            key: "EMAIL_PASS",
            issues
        })

        if (
            Object.prototype.hasOwnProperty.call(env, "EMAIL_FROM") &&
            !readTrimmedValue(env, "EMAIL_FROM")
        ) {
            issues.push("EMAIL_FROM must not be empty when provided")
        }
    }

    const hasRazorpayConfig = validateConfigGroup({
        env,
        keys: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"],
        groupLabel: "Razorpay configuration",
        issues
    })

    if (hasRazorpayConfig) {
        validateSecretValue({
            env,
            key: "RAZORPAY_KEY_ID",
            issues
        })
        validateSecretValue({
            env,
            key: "RAZORPAY_KEY_SECRET",
            issues
        })
    }

    if (hasValue(env, "RAZORPAY_REQUEST_TIMEOUT_MS")) {
        ensureIntegerInRange({
            label: "RAZORPAY_REQUEST_TIMEOUT_MS",
            value: readTrimmedValue(env, "RAZORPAY_REQUEST_TIMEOUT_MS"),
            minimum: 1000,
            maximum: Number.MAX_SAFE_INTEGER,
            issues
        })
    }

    ;[
        "GENERAL_RATE_LIMIT_WINDOW_MS",
        "GENERAL_RATE_LIMIT_MAX",
        "AUTH_RATE_LIMIT_WINDOW_MS",
        "AUTH_RATE_LIMIT_MAX",
        "INVITE_RATE_LIMIT_WINDOW_MS",
        "INVITE_RATE_LIMIT_MAX",
        "BILLING_RATE_LIMIT_WINDOW_MS",
        "BILLING_RATE_LIMIT_MAX"
    ].forEach((key) => {
        if (!hasValue(env, key)) {
            return
        }

        ensureIntegerInRange({
            label: key,
            value: readTrimmedValue(env, key),
            minimum: 1,
            maximum: Number.MAX_SAFE_INTEGER,
            issues
        })
    })

    if (issues.length > 0) {
        throw buildValidationError(issues)
    }
}

const loadEnvironment = (env = process.env) => {
    if (env === process.env && fs.existsSync(ENV_PATH)) {
        dotenv.config({
            path: ENV_PATH,
            quiet: true
        })
    }

    if (!readTrimmedValue(env, "NODE_ENV")) {
        env.NODE_ENV = "development"
    }

    validateEnvironment(env)

    return env
}

module.exports = {
    ENV_PATH,
    loadEnvironment,
    validateEnvironment
}
