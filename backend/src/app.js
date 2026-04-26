const { loadEnvironment } = require("./config/env")
loadEnvironment()
const fs = require("fs")
const path = require("path")
const mongoose = require("mongoose")
const express = require('express')
const router = require('./routes/auth.route')
const { serializeAuthUser } = require("./utils/authUser")

const authenticate = require('./middleware/auth.middleware')
const resolveTenant = require('./middleware/tenant.middleware')
const requireRole = require('./middleware/rbac.middleware')
const errorHandler = require('./middleware/errorHandler.middleware')

const projectRoutes = require('./routes/project.route')
const clientRoutes = require('./routes/client.route')
const activityRoutes = require('./routes/activity.route')
const dashboardRoutes = require('./routes/dashboard.route')
const billingRoutes = require('./routes/billing.route')
const auditRoutes = require("./routes/audit.route")
const cors = require('cors')
const inviteRoutes = require('./routes/invite.route')
const memberRoutes = require('./routes/member.route')
const tenantRoutes = require('./routes/tenant.route')
const userRoutes = require('./routes/user.route')
const accountRoutes = require('./routes/account.route')
const taskRoutes = require('./routes/task.route')
const securityHeaders = require("./middleware/securityHeaders.middleware")
const { createRateLimiter } = require("./middleware/rateLimit.middleware")

const app = express()
const protectedApi = express.Router()
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist")
const frontendIndexPath = path.join(frontendDistPath, "index.html")
const hasFrontendBuild = fs.existsSync(frontendIndexPath)
const isProduction = process.env.NODE_ENV === "production"
const generalApiRateLimiter = createRateLimiter({
    windowMs: Number(process.env.GENERAL_RATE_LIMIT_WINDOW_MS) || 60 * 1000,
    max: Number(process.env.GENERAL_RATE_LIMIT_MAX) || 240,
    message: "Too many API requests. Please try again shortly.",
    code: "rate_limit_exceeded"
})
const databaseStates = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
}

const corsAllowedOrigins = readAllowedOrigins()

app.disable("x-powered-by")
app.set("trust proxy", getTrustProxySetting())
app.use(securityHeaders())

app.use(cors(buildCorsOptions()))
app.use(express.json({
    limit: process.env.JSON_BODY_LIMIT || "100kb"
}))
app.use(express.urlencoded({
    extended: false,
    limit: process.env.JSON_BODY_LIMIT || "100kb"
}))

app.get("/api/health", (req, res) => {
    const readyState = mongoose.connection.readyState
    const isDatabaseReady = readyState === 1

    res.status(isDatabaseReady ? 200 : 503).json({
        status: isDatabaseReady ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
        services: {
            api: "ok",
            database: {
                status: isDatabaseReady ? "up" : "down",
                readyState,
                state: databaseStates[readyState] || "unknown"
            }
        }
    })
})

app.use("/api", generalApiRateLimiter)

{/* PUBLIC ROUTES */}
app.use("/api/auth", router)
app.use("/api/user-invite", inviteRoutes)

protectedApi.use(authenticate)
protectedApi.use(resolveTenant)

protectedApi.get("/me", (req, res) => {
    res.json({
        user: serializeAuthUser(req.user),
        sessionId: req.auth?.session?._id,
        tenant: {
            id: req.tenantId,
            name: req.tenant.name,
            slug: req.tenant.slug || null,
            plan: req.tenant.plan
        }
    })
})

protectedApi.get("/owner-only", requireRole(["owner"]), (req, res) => {
    res.json({ message: "Welcome owner"})
})

protectedApi.get("/admin-only", requireRole(["owner", "admin"]), (req, res) => {
    res.json({ message: "Welcome admin or owner"})
})

protectedApi.get("/member-only", requireRole(["owner", "admin", "member"]), (req, res) => {
    res.json({ message: "Welcome team member"})
})

protectedApi.use("/projects", projectRoutes)
protectedApi.use("/clients", clientRoutes)
protectedApi.use("/activity-feed", activityRoutes)
protectedApi.use("/dashboard", dashboardRoutes)
protectedApi.use("/billing", billingRoutes)
protectedApi.use("/audit-logs", auditRoutes)
protectedApi.use("/members", memberRoutes)
protectedApi.use("/tenants", tenantRoutes)
protectedApi.use("/account", accountRoutes)
protectedApi.use("/users", userRoutes)
protectedApi.use(taskRoutes)

app.use("/api", protectedApi)

if (hasFrontendBuild) {
    app.use(express.static(frontendDistPath))

    app.get(/^\/(?!api(?:\/|$)).*/, (req, res) => {
        res.sendFile(frontendIndexPath)
    })
}

app.use(errorHandler)

module.exports = app

function readAllowedOrigins() {
    const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)

    return Array.from(
        new Set(
            [
                process.env.FRONTEND_URL,
                ...configuredOrigins,
                !isProduction ? "http://localhost:5173" : null
            ].filter(Boolean)
        )
    )
}

function buildCorsOptions() {
    return {
        origin: (origin, callback) => {
            if (!origin) {
                callback(null, true)
                return
            }

            callback(null, corsAllowedOrigins.includes(origin))
        },
        credentials: true
    }
}

function getTrustProxySetting() {
    const rawValue = process.env.TRUST_PROXY?.trim().toLowerCase()

    if (!rawValue) {
        return isProduction
    }

    return rawValue === "true"
}
