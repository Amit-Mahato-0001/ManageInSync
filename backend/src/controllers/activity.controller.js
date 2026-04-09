const { listActivityFeed } = require("../services/activity.service")

const getActivityFeedHandler = async (req, res, next) => {
    try {
        const activities = await listActivityFeed({
            tenantId: req.tenantId,
            user: req.user,
            page: req.query.page,
            limit: req.query.limit,
            category: req.query.category
        })

        return res.status(200).json({ activities })
    } catch (error) {
        next(error)
    }
}

module.exports = { getActivityFeedHandler }
