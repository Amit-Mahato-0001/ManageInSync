const assert = require("node:assert/strict")
const {
    applyTestEnvironment,
    clearBackendModuleCache
} = require("./helpers/testEnv")

const loadEmailUtils = (overrides = {}) => {
    const restoreEnvironment = applyTestEnvironment({
        EMAIL_HOST: "smtp.manageinsync.dev",
        EMAIL_PORT: "587",
        EMAIL_USER: "ops@manageinsync.dev",
        EMAIL_PASS: "mail-password",
        ...overrides
    })

    clearBackendModuleCache()

    return {
        emailUtils: require("../src/utils/email"),
        restoreEnvironment
    }
}

{
    const { emailUtils, restoreEnvironment } = loadEmailUtils({
        EMAIL_SECURE: "false",
        EMAIL_REQUIRE_TLS: "true",
        EMAIL_FROM: "\"ManageInSync\" <noreply@manageinsync.dev>"
    })
    const transportConfig = emailUtils.getEmailTransportConfig()

    assert.equal(transportConfig.port, 587)
    assert.equal(transportConfig.secure, false)
    assert.equal(transportConfig.requireTLS, true)
    assert.equal(transportConfig.connectionTimeout, 10000)
    assert.equal(transportConfig.greetingTimeout, 10000)
    assert.equal(transportConfig.socketTimeout, 20000)
    assert.equal(
        emailUtils.getEmailFromAddress(),
        "\"ManageInSync\" <noreply@manageinsync.dev>"
    )
    assert.equal(
        emailUtils.buildInviteLink({
            inviteToken: "abc 123",
            workspace: "manageinsync"
        }),
        "https://app.manageinsync.test/accept-invite?token=abc+123&workspace=manageinsync"
    )
    assert.equal(
        emailUtils.buildPasswordResetLink({
            resetToken: "reset 123",
            workspace: "manageinsync"
        }),
        "https://app.manageinsync.test/reset-password?token=reset+123&workspace=manageinsync"
    )

    restoreEnvironment()
    clearBackendModuleCache()
}

{
    const { emailUtils, restoreEnvironment } = loadEmailUtils({
        EMAIL_PORT: "465",
        EMAIL_SECURE: "true",
        EMAIL_REQUIRE_TLS: "false",
        EMAIL_CONNECTION_TIMEOUT_MS: "3000",
        EMAIL_GREETING_TIMEOUT_MS: "4000",
        EMAIL_SOCKET_TIMEOUT_MS: "5000"
    })
    const transportConfig = emailUtils.getEmailTransportConfig()

    assert.equal(transportConfig.secure, true)
    assert.equal(transportConfig.requireTLS, false)
    assert.equal(transportConfig.connectionTimeout, 3000)
    assert.equal(transportConfig.greetingTimeout, 4000)
    assert.equal(transportConfig.socketTimeout, 5000)

    restoreEnvironment()
    clearBackendModuleCache()
}

console.log("Email utility tests passed")
