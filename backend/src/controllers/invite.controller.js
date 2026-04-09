const { inviteUser } = require('../services/invite.service')
const {
  ACTIVITY_CATEGORIES,
  ACTIVITY_VISIBILITY,
  buildActorSnapshot,
  buildTargetUserSnapshot,
  recordActivity
} = require("../services/activity.service")

const getActorLabel = (user) => user?.email || "Someone"

const inviteUserHandler = (targetRole) => async (req, res, next) => {

  try {

    const {email} = req.body;

    const result = await inviteUser({

      email,
      tenantId: req.tenantId,
      role: targetRole,
      invitedByRole: req.user?.role

    });

    await recordActivity({
      tenantId: req.tenantId,
      type: `${targetRole}.invited`,
      category: targetRole === "client" ? ACTIVITY_CATEGORIES.CLIENT : ACTIVITY_CATEGORIES.TEAM,
      summary: `${getActorLabel(req.user)} invited ${targetRole} ${result.email}`,
      actor: buildActorSnapshot(req.user),
      targetUser: buildTargetUserSnapshot(result),
      visibility: ACTIVITY_VISIBILITY.ADMIN,
      meta: {
        role: result.role
      }
    })

    res.status(200).json({

      message: `${targetRole} invited successfully`,
      ...result,

    });

  } catch (error) {

    next(error)
  }

};

module.exports = { inviteUserHandler }
