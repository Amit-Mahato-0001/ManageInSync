const assert = require("node:assert/strict")
const {
    applyTestEnvironment,
    clearBackendModuleCache
} = require("./helpers/testEnv")

const loadRazorpayUtils = (overrides = {}) => {
    const restoreEnvironment = applyTestEnvironment(overrides)
    clearBackendModuleCache()

    return {
        razorpayUtils: require("../src/utils/razorpay"),
        restoreEnvironment
    }
}

{
    const { razorpayUtils, restoreEnvironment } = loadRazorpayUtils({
        RAZORPAY_KEY_ID: "rzp_test_123456",
        RAZORPAY_KEY_SECRET: "secret",
        RAZORPAY_REQUEST_TIMEOUT_MS: "15000"
    })

    assert.deepEqual(razorpayUtils.getRazorpayPublicConfig(), {
        keyId: "rzp_test_123456",
        mode: "test"
    })
    assert.equal(razorpayUtils.getRazorpayTimeoutMs(), 15000)

    restoreEnvironment()
    clearBackendModuleCache()
}

{
    const { razorpayUtils, restoreEnvironment } = loadRazorpayUtils({
        RAZORPAY_KEY_ID: "rzp_live_123456",
        RAZORPAY_KEY_SECRET: "secret"
    })

    assert.deepEqual(razorpayUtils.getRazorpayPublicConfig(), {
        keyId: "rzp_live_123456",
        mode: "live"
    })
    assert.equal(razorpayUtils.getRazorpayTimeoutMs(), 10000)

    restoreEnvironment()
    clearBackendModuleCache()
}

console.log("Razorpay utility tests passed")
