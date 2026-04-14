require('dotenv').config()
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

{/* PUBLIC ROUTES */}
app.use("/api/auth", router)
app.use("/api/user-invite", inviteRoutes)

app.use(authenticate)
app.use(resolveTenant)

app.get("/api/me", (req, res) => {
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

app.get("/api/owner-only", requireRole(["owner"]), (req, res) => {
    res.json({ message: "Welcome owner"})
})

app.get("/api/admin-only", requireRole(["owner", "admin"]), (req, res) => {
    res.json({ message: "Welcome admin or owner"})
})

app.get("/api/member-only", requireRole(["owner", "admin", "member"]), (req, res) => {
    res.json({ message: "Welcome team member"})
})

app.use("/api/projects", projectRoutes)
app.use("/api/clients", clientRoutes)
app.use("/api/activity-feed", activityRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/billing", billingRoutes)
app.use("/api/members", memberRoutes)
app.use("/api/tenants", tenantRoutes)
app.use("/api/users", userRoutes)
app.use("/api", taskRoutes)

app.use(errorHandler)

module.exports = app
