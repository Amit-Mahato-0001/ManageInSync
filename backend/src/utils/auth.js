const crypto = require("crypto")

const DEFAULT_ACCESS_TOKEN_TTL = "15m"
const DEFAULT_REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

const parsedRefreshTokenTtlMs = Number(process.env.REFRESH_TOKEN_TTL_MS)

const REFRESH_TOKEN_TTL_MS =
    Number.isFinite(parsedRefreshTokenTtlMs) && parsedRefreshTokenTtlMs > 0
        ? parsedRefreshTokenTtlMs
        : DEFAULT_REFRESH_TOKEN_TTL_MS

const REFRESH_TOKEN_COOKIE_NAME =
    process.env.REFRESH_TOKEN_COOKIE_NAME || "refreshToken"

const REFRESH_TOKEN_COOKIE_PATH =
    process.env.REFRESH_TOKEN_COOKIE_PATH || "/api/auth"

const getAccessTokenSecret = () =>
    process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET

const getAccessTokenTtl = () =>
    process.env.ACCESS_TOKEN_TTL || DEFAULT_ACCESS_TOKEN_TTL

const getRefreshTokenTtlMs = () => REFRESH_TOKEN_TTL_MS

const getRefreshExpiryDate = () =>
    new Date(Date.now() + REFRESH_TOKEN_TTL_MS)

const generateRefreshToken = () =>
    crypto.randomBytes(48).toString("hex")

const hashToken = (value = "") =>
    crypto.createHash("sha256").update(value).digest("hex")

const parseCookies = (cookieHeader = "") =>
    cookieHeader
        .split(";")
        .map((cookiePart) => cookiePart.trim())
        .filter(Boolean)
        .reduce((accumulator, cookiePart) => {
            const separatorIndex = cookiePart.indexOf("=")

            if (separatorIndex === -1) {
                return accumulator
            }

            const key = cookiePart.slice(0, separatorIndex).trim()
            const rawValue = cookiePart.slice(separatorIndex + 1).trim()

            accumulator[key] = decodeURIComponent(rawValue)

            return accumulator
        }, {})

const getRefreshTokenFromRequest = (req) => {
    const cookies = parseCookies(req?.headers?.cookie)

    return cookies[REFRESH_TOKEN_COOKIE_NAME] || null
}

const getRefreshCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.REFRESH_TOKEN_SAME_SITE || "strict",
    path: REFRESH_TOKEN_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_TTL_MS
})

const setRefreshCookie = (res, token) => {
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, getRefreshCookieOptions())
}

const clearRefreshCookie = (res) => {
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.REFRESH_TOKEN_SAME_SITE || "strict",
        path: REFRESH_TOKEN_COOKIE_PATH
    })
}

const getClientIp = (req) => {
    const forwardedFor = req?.headers?.["x-forwarded-for"]

    if (typeof forwardedFor === "string" && forwardedFor.trim()) {
        return forwardedFor.split(",")[0].trim()
    }

    return req?.socket?.remoteAddress || ""
}

const getUserAgent = (req) =>
    req?.headers?.["user-agent"] || ""

module.exports = {
    clearRefreshCookie,
    generateRefreshToken,
    getAccessTokenSecret,
    getAccessTokenTtl,
    getClientIp,
    getRefreshCookieOptions,
    getRefreshExpiryDate,
    getRefreshTokenFromRequest,
    getRefreshTokenTtlMs,
    getUserAgent,
    hashToken,
    parseCookies,
    setRefreshCookie
}
