require("./config/env")
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
const cors = require('cors')
const inviteRoutes = require('./routes/invite.route')
const memberRoutes = require('./routes/member.route')
const tenantRoutes = require('./routes/tenant.route')
const userRoutes = require('./routes/user.route')
const taskRoutes = require('./routes/task.route')

const app = express()
const protectedApi = express.Router()
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist")
const frontendIndexPath = path.join(frontendDistPath, "index.html")
const hasFrontendBuild = fs.existsSync(frontendIndexPath)
const databaseStates = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
}

const allowedOrigins = Array.from(
    new Set(
        [
            process.env.FRONTEND_URL,
            "http://localhost:5173"
        ].filter(Boolean)
    )
)

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}))
app.use(express.json())

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
protectedApi.use("/members", memberRoutes)
protectedApi.use("/tenants", tenantRoutes)
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
