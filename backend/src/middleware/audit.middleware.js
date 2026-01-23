const logAction = require('../services/audit.service')

const auditLogger = (action) => {

    return async(req, res, next) => {
        
        res.on("finish", async() => {

            if(res.statusCode < 400){

                await logAction({
                    tenantId: req.tenantId,
                    actorId: req.user.userId,
                    action,
                    meta: {
                        method: req.method,
                        path: req.originalUrl
                    }
                })
            }
        })

        next()
    }
}

module.exports = auditLogger