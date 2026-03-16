const { inviteUser } = require('../services/invite.service')

const inviteUserHandler = (targetRole) => async (req, res, next) => {

  try {

    const {email} = req.body;

    const result = await inviteUser({

      email,
      tenantId: req.tenantId,
      role: targetRole,
      invitedByRole: req.user?.role

    });

    res.status(200).json({

      message: `${targetRole} invited successfully`,
      ...result,

    });

  } catch (error) {

    next(error)
  }

};

module.exports = { inviteUserHandler }