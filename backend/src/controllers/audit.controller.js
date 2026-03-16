const AuditLog = require('../models/audit.model')

const getAuditLogs = async(req, res, next) => {

    try {
        const logs = await AuditLog.find({
            tenantId: req.tenantId
        })

        .sort({ createdAt: -1})
        .limit(100)

        res.json(logs)

    } catch (error) {

        next(error)
    }
}

module.exports = getAuditLogs