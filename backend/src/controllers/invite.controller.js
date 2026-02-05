const { inviteClient } = require('../services/invite.service')

const inviteClientHandler = async (req, res) => {

  try {

    const {email} = req.body;

    const result = await inviteClient({

      email,
      tenantId: req.tenantId,

    });

    res.status(200).json({

      message: "Client invited",
      ...result,

    });

  } catch (e) {

    res.status(400).json({ message: e.message });
  }

};

module.exports = { inviteClientHandler };
