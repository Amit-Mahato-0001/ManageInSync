require('dotenv').config()
const express = require('express')
const connectDB = require('./config/db')
const router = require('./routes/auth.route')
const authenticate = require('./middleware/auth.middleware')
const resolveTenant = require('./middleware/tenant.middleware')

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

module.exports = app