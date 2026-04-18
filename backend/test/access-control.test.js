const assert = require("node:assert/strict")

const requireRole = require("../src/middleware/rbac.middleware")
const resolveTenant = require("../src/middleware/tenant.middleware")
const Tenant = require("../src/models/tenant.model")

const createResponse = () => ({
    statusCode: 200,
    body: null,
    status(code) {
        this.statusCode = code
        return this
    },
    json(payload) {
        this.body = payload
        return this
    }
})

{
    const middleware = requireRole(["owner", "admin"])
    const req = {
        user: {
            role: "owner"
        }
    }
    let nextCalled = false

    middleware(req, createResponse(), () => {
        nextCalled = true
    })

    assert.equal(nextCalled, true)
}

{
    const middleware = requireRole(["owner"])
    const res = createResponse()

    middleware(
        {
            user: {
                role: "member"
            }
        },
        res,
        () => {}
    )

    assert.equal(res.statusCode, 403)
    assert.deepEqual(res.body, {
        message: "Access denied"
    })
}

const originalFindById = Tenant.findById

;(async () => {
    try {
        Tenant.findById = async (tenantId) => ({
            _id: tenantId,
            name: "ManageInSync"
        })

        const req = {
            user: {
                tenantId: "tenant-123"
            }
        }
        let nextCalled = false

        await resolveTenant(req, createResponse(), () => {
            nextCalled = true
        })

        assert.equal(nextCalled, true)
        assert.equal(req.tenantId, "tenant-123")
        assert.equal(req.tenant.name, "ManageInSync")

        const missingTenantResponse = createResponse()

        await resolveTenant(
            {
                user: {}
            },
            missingTenantResponse,
            () => {}
        )

        assert.equal(missingTenantResponse.statusCode, 400)
        assert.deepEqual(missingTenantResponse.body, {
            message: "Tenant not found"
        })
    } finally {
        Tenant.findById = originalFindById
    }

    console.log("Access control tests passed")
})().catch((error) => {
    console.error(error)
    process.exit(1)
})
