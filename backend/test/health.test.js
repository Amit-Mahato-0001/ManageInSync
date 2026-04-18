const assert = require("node:assert/strict")
const http = require("node:http")
const {
    applyTestEnvironment,
    clearBackendModuleCache
} = require("./helpers/testEnv")

const restoreEnvironment = applyTestEnvironment()
clearBackendModuleCache()
const app = require("../src/app")

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
    const server = http.createServer(app)
    const address = await listen(server)

    try {
        const response = await fetch(`http://127.0.0.1:${address.port}/api/health`)
        const body = await response.json()

        assert.equal(response.status, 503)
        assert.equal(body.status, "degraded")
        assert.equal(body.services.api, "ok")
        assert.equal(body.services.database.status, "down")
        assert.equal(body.services.database.readyState, 0)
        assert.equal(body.services.database.state, "disconnected")
        assert.ok(body.timestamp)
        assert.equal(typeof body.uptimeSeconds, "number")
        console.log("Health smoke test passed")
    } finally {
        await close(server)
    }
}

run().catch((error) => {
    console.error(error)
    process.exit(1)
})

process.on("exit", () => {
    restoreEnvironment()
})
