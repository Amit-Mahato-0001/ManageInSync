const dashboard = require('../services/dashboard.service')

const dashboardHandler = async (req, res, next) => {

    try {
        
        const dashboardStats = await dashboard(req.tenantId)

        res.json({
            tenantId: req.tenantId,
            dashboardStats
        })

    } catch (error) {
        
        next(error)
    }
}

module.exports = dashboardHandler