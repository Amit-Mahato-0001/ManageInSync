const AuditLog = require('../models/audit.model')

const getAuditLogs = async(req, res) => {

    try {
        const logs = await AuditLog.find({
            tenantId: req.tenantId
        })

        .sort({ createdAt: -1})
        .limit(100)

        res.json(logs)

    } catch (error) {
        res.status(500).json({ message: "Failed to get audit logs"})
    }
}

module.exports = getAuditLogs