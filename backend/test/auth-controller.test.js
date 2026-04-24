const assert = require("node:assert/strict")
const {
    applyTestEnvironment,
    clearBackendModuleCache
} = require("./helpers/testEnv")

const createResponse = () => ({
    statusCode: 200,
    payload: null,
    status(code) {
        this.statusCode = code
        return this
    },
    json(body) {
        this.payload = body
        return this
    }
})

const loadAuthController = ({
    authServiceOverrides = {},
    authUtilsOverrides = {}
} = {}) => {
    const restoreEnvironment = applyTestEnvironment()
    clearBackendModuleCache()

    const controllerPath = require.resolve("../src/controllers/auth.controller")
    const authServicePath = require.resolve("../src/services/auth.service")
    const activityServicePath = require.resolve("../src/services/activity.service")
    const auditServicePath = require.resolve("../src/services/audit.service")
    const authUtilsPath = require.resolve("../src/utils/auth")

    const sharedState = {
        setRefreshCookieCalls: [],
        clearRefreshCookieCalls: 0
    }

    require.cache[authServicePath] = {
        id: authServicePath,
        filename: authServicePath,
        loaded: true,
        exports: {
            signup: async () => ({
                accessToken: "signup-token",
                refreshToken: "signup-refresh",
                user: {
                    _id: "user-1",
                    tenantId: "tenant-1",
                    email: "owner@manageinsync.test",
                    role: "owner"
                },
                tenant: {
                    id: "tenant-1",
                    name: "ManageInSync",
                    slug: "manageinsync"
                }
            }),
            login: async () => ({
                accessToken: "login-token",
                refreshToken: "login-refresh",
                user: {
                    _id: "user-1",
                    tenantId: "tenant-1",
                    email: "owner@manageinsync.test",
                    role: "owner"
                },
                tenant: {
                    id: "tenant-1",
                    name: "ManageInSync",
                    slug: "manageinsync"
                }
            }),
            refreshSession: async () => ({
                accessToken: "refresh-token",
                refreshToken: "refresh-refresh",
                user: {
                    _id: "user-1",
                    tenantId: "tenant-1",
                    email: "owner@manageinsync.test",
                    role: "owner"
                },
                tenant: {
                    id: "tenant-1",
                    name: "ManageInSync",
                    slug: "manageinsync"
                }
            }),
            logout: async () => ({
                success: true
            }),
            logoutAll: async () => ({
                success: true
            }),
            requestPasswordReset: async () => ({
                success: true
            }),
            resetPassword: async () => ({
                message: "Password reset successful. Please log in again.",
                workspace: {
                    id: "tenant-1",
                    name: "ManageInSync",
                    slug: "manageinsync"
                }
            }),
            changePassword: async () => ({
                message: "Password changed successfully. Please log in again.",
                workspace: {
                    id: "tenant-1",
                    name: "ManageInSync",
                    slug: "manageinsync"
                }
            }),
            acceptInvite: async () => ({
                message: "Password set successfully",
                user: {
                    _id: "user-1",
                    tenantId: "tenant-1",
                    email: "client@manageinsync.test",
                    role: "client"
                }
            }),
            ...authServiceOverrides
        }
    }

    require.cache[activityServicePath] = {
        id: activityServicePath,
        filename: activityServicePath,
        loaded: true,
        exports: {
            ACTIVITY_CATEGORIES: {
                CLIENT: "client",
                TEAM: "team"
            },
            ACTIVITY_VISIBILITY: {
                ADMIN: "admin",
                TEAM: "team"
            },
            buildActorSnapshot: () => ({}),
            buildTargetUserSnapshot: () => ({}),
            recordActivity: async () => {}
        }
    }

    require.cache[auditServicePath] = {
        id: auditServicePath,
        filename: auditServicePath,
        loaded: true,
        exports: async () => {}
    }

    require.cache[authUtilsPath] = {
        id: authUtilsPath,
        filename: authUtilsPath,
        loaded: true,
        exports: {
            getRefreshTokenFromRequest: () => "refresh-token-from-cookie",
            setRefreshCookie: (res, token) => {
                sharedState.setRefreshCookieCalls.push(token)
                return res
            },
            clearRefreshCookie: () => {
                sharedState.clearRefreshCookieCalls += 1
            },
            ...authUtilsOverrides
        }
    }

    delete require.cache[controllerPath]

    return {
        authController: require(controllerPath),
        restoreEnvironment,
        sharedState
    }
}

;(async () => {
    {
        const { authController, restoreEnvironment, sharedState } = loadAuthController()
        const res = createResponse()
        let nextCalled = false

        await authController.loginHandler(
            {
                body: {
                    workspace: "manageinsync",
                    email: "owner@manageinsync.test",
                    password: "password123"
                }
            },
            res,
            () => {
                nextCalled = true
            }
        )

        assert.equal(nextCalled, false)
        assert.equal(res.statusCode, 200)
        assert.equal(res.payload.message, "Login successful")
        assert.equal(res.payload.accessToken, "login-token")
        assert.equal(res.payload.tenant.slug, "manageinsync")
        assert.deepEqual(sharedState.setRefreshCookieCalls, ["login-refresh"])

        restoreEnvironment()
        clearBackendModuleCache()
    }

    {
        const { authController, restoreEnvironment } = loadAuthController()
        const res = createResponse()
        let nextCalled = false

        await authController.forgotPasswordHandler(
            {
                body: {
                    workspace: "manageinsync",
                    email: "owner@manageinsync.test"
                }
            },
            res,
            () => {
                nextCalled = true
            }
        )

        assert.equal(nextCalled, false)
        assert.equal(res.statusCode, 200)
        assert.match(res.payload.message, /reset link has been sent/i)

        restoreEnvironment()
        clearBackendModuleCache()
    }

    {
        const { authController, restoreEnvironment, sharedState } = loadAuthController()
        const res = createResponse()
        let nextCalled = false

        await authController.changePasswordHandler(
            {
                user: {
                    _id: "user-1",
                    tenantId: "tenant-1",
                    email: "owner@manageinsync.test",
                    role: "owner"
                },
                body: {
                    currentPassword: "password123",
                    newPassword: "new-password123"
                }
            },
            res,
            () => {
                nextCalled = true
            }
        )

        assert.equal(nextCalled, false)
        assert.equal(res.statusCode, 200)
        assert.match(res.payload.message, /password changed successfully/i)
        assert.equal(sharedState.clearRefreshCookieCalls, 1)

        restoreEnvironment()
        clearBackendModuleCache()
    }

    {
        const expectedError = new Error("refresh failed")
        const { authController, restoreEnvironment, sharedState } = loadAuthController({
            authServiceOverrides: {
                refreshSession: async () => {
                    throw expectedError
                }
            }
        })

        let forwardedError = null

        await authController.refreshHandler(
            {
                headers: {
                    cookie: "refreshToken=value"
                }
            },
            createResponse(),
            (error) => {
                forwardedError = error
            }
        )

        assert.equal(forwardedError, expectedError)
        assert.equal(sharedState.clearRefreshCookieCalls, 1)

        restoreEnvironment()
        clearBackendModuleCache()
    }

    console.log("Auth controller tests passed")
})().catch((error) => {
    console.error(error)
    process.exit(1)
})
