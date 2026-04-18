const assert = require("node:assert/strict")
const {
    applyTestEnvironment,
    clearBackendModuleCache
} = require("./helpers/testEnv")

const loadAuthUtils = (overrides = {}) => {
    const restoreEnvironment = applyTestEnvironment(overrides)
    clearBackendModuleCache()
    const authUtils = require("../src/utils/auth")

    return {
        authUtils,
        restoreEnvironment
    }
}

{
    const { authUtils, restoreEnvironment } = loadAuthUtils({
        NODE_ENV: "production",
        REFRESH_TOKEN_SAME_SITE: "none",
        COOKIE_DOMAIN: ".manageinsync.com"
    })
    const cookieOptions = authUtils.getRefreshCookieOptions()

    assert.equal(cookieOptions.httpOnly, true)
    assert.equal(cookieOptions.secure, true)
    assert.equal(cookieOptions.sameSite, "none")
    assert.equal(cookieOptions.domain, ".manageinsync.com")
    assert.equal(cookieOptions.path, "/api/auth")

    restoreEnvironment()
    clearBackendModuleCache()
}

{
    const { authUtils, restoreEnvironment } = loadAuthUtils()
    const token = authUtils.getRefreshTokenFromRequest({
        headers: {
            cookie: "theme=dark; refreshToken=abc123%3D; locale=en"
        }
    })

    assert.equal(token, "abc123=")
    assert.equal(authUtils.getRefreshCookieSameSite(), "strict")

    restoreEnvironment()
    clearBackendModuleCache()
}

console.log("Auth utility tests passed")
