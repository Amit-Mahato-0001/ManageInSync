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
        EMAIL_PORT: "465"
    })
    const transportConfig = emailUtils.getEmailTransportConfig()

    assert.equal(transportConfig.secure, true)
    assert.equal(transportConfig.requireTLS, false)

    restoreEnvironment()
    clearBackendModuleCache()
}

console.log("Email utility tests passed")
