require('dotenv').config()
const express = require('express')
const connectDB = require('./config/db')
const router = require('./routes/auth.route')
const authenticate = require('./middleware/auth.middleware')
const resolveTenant = require('./middleware/tenant.middleware')
const requireRole = require('./middleware/rbac.middleware')

const app = express()
connectDB()

app.use(express.json())
app.use("/api/auth", router)
app.use(authenticate)
app.use(resolveTenant)

app.get("/api/me", (req, res) => {
    res.json({
        user: req.user,
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

module.exports = app