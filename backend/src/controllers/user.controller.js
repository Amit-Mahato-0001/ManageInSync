const createUser = require('../services/user.service')

const createUserHandler = async(req, res, next) => {

  try {

    const userData = {
      
      email: req.body.email,
      password: req.body.password,
      tenantId: req.user.tenantId
    }

    const user = await createUser(userData)

    return res.status(201).json({

      message: 'User created',
      userId: user._id
    })

  } catch(error) {

    next(error)

  }
}

module.exports = createUserHandler
