const { inviteUser } = require('../services/invite.service')

const inviteUserHandler = async (req, res) => {

  try {

    const {email, role } = req.body;

    const result = await inviteUser({

      email,
      tenantId: req.tenantId,
      role

    });

    res.status(200).json({

      message: `${role} invited successfully`,
      ...result,

    });

  } catch (e) {

    res.status(400).json({ message: e.message });
  }

};

module.exports = { inviteUserHandler }
