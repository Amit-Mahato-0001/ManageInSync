const AuditLog = require('../models/audit.model')

const getAuditLogs = async(req, res, next) => {

    try {
        const safePage = Math.max(1, Number(req.query.page) || 1)
        const safeLimit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))
        const skip = (safePage - 1) * safeLimit
        const search = req.query.search?.trim()
        const query = {
            tenantId: req.tenantId
        }

        if (search) {
            query.action = {
                $regex: search,
                $options: "i"
            }
        }

        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .sort({ createdAt: -1})
                .skip(skip)
                .limit(safeLimit)
                .populate("actorId", "email role")
                .lean(),
            AuditLog.countDocuments(query)
        ])

        res.json({
            auditLogs: {
                data: logs.map((log) => ({
                    ...log,
                    actor: log.actorId
                        ? {
                            _id: log.actorId._id,
                            email: log.actorId.email,
                            role: log.actorId.role
                        }
                        : null
                })),
                pagination: {
                    total,
                    page: safePage,
                    limit: safeLimit,
                    totalPages: Math.max(1, Math.ceil(total / safeLimit))
                }
            }
        })

    } catch (error) {

        next(error)
    }
}

module.exports = getAuditLogs
