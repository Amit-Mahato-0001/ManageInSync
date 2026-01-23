const AuditLog = require('../models/audit.model')

const logAction = async({ tenantId, actorId, action, meta}) => {

    return AuditLog.create({
        tenantId,
        actorId,
        action,
        meta
    })

}

module.exports = logAction