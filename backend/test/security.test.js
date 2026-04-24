const assert = require("node:assert/strict")
const http = require("node:http")
const {
    applyTestEnvironment,
    clearBackendModuleCache
} = require("./helpers/testEnv")

const listen = (server) =>
    new Promise((resolve, reject) => {
        server.listen(0, "127.0.0.1", (error) => {
            if (error) {
                reject(error)
                return
            }

            resolve(server.address())
        })
    })

const close = (server) =>
    new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error)
                return
            }

            resolve()
        })
    })

const run = async () => {
    const restoreEnvironment = applyTestEnvironment({
        AUTH_RATE_LIMIT_MAX: "2",
        AUTH_RATE_LIMIT_WINDOW_MS: "60000",
        JSON_BODY_LIMIT: "1kb"
    })

    clearBackendModuleCache()
    const app = require("../src/app")
    const server = http.createServer(app)
    const address = await listen(server)
    const baseUrl = `http://127.0.0.1:${address.port}`

    try {
        const allowedOriginResponse = await fetch(`${baseUrl}/api/health`, {
            headers: {
                Origin: "https://app.manageinsync.test"
            }
        })

        assert.equal(
            allowedOriginResponse.headers.get("access-control-allow-origin"),
            "https://app.manageinsync.test"
        )
        assert.equal(
            allowedOriginResponse.headers.get("access-control-allow-credentials"),
            "true"
        )
        assert.equal(
            allowedOriginResponse.headers.get("x-content-type-options"),
            "nosniff"
        )
        assert.equal(
            allowedOriginResponse.headers.get("x-frame-options"),
            "DENY"
        )
        assert.equal(
            allowedOriginResponse.headers.get("referrer-policy"),
            "strict-origin-when-cross-origin"
        )
        assert.equal(
            allowedOriginResponse.headers.get("cross-origin-opener-policy"),
            "same-origin"
        )

        const blockedOriginResponse = await fetch(`${baseUrl}/api/health`, {
            headers: {
                Origin: "https://evil.example.com"
            }
        })

        assert.equal(
            blockedOriginResponse.headers.get("access-control-allow-origin"),
            null
        )

        for (let attempt = 0; attempt < 2; attempt += 1) {
            const response = await fetch(`${baseUrl}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    workspace: "demo-workspace",
                    email: "not-an-email",
                    password: "short"
                })
            })

            assert.equal(response.status, 400)
        }

        const throttledResponse = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                workspace: "demo-workspace",
                email: "not-an-email",
                password: "short"
            })
        })
        const throttledBody = await throttledResponse.json()

        assert.equal(throttledResponse.status, 429)
        assert.equal(throttledBody.code, "auth_rate_limit_exceeded")
        assert.ok(Number(throttledResponse.headers.get("retry-after")) >= 0)

        const oversizedPayload = JSON.stringify({
            workspace: "demo-workspace",
            email: "person@example.com",
            password: "a".repeat(3000)
        })

        const oversizedResponse = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: oversizedPayload
        })

        assert.equal(oversizedResponse.status, 413)
    } finally {
        await close(server)
        restoreEnvironment()
        clearBackendModuleCache()
    }
}

run().then(() => {
    console.log("Security middleware tests passed")
}).catch((error) => {
    console.error(error)
    process.exit(1)
})
