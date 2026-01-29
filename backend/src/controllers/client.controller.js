const { createClient, getClients } = require('../services/client.service')

const createClientHandler = async (req, res) => {
  try {
    const { email, name } = req.body

    if (!email) {
      return res.status(400).json({
        message: "Email is required"
      })
    }

    const client = await createClient({
      email,
      name,
      tenantId: req.tenantId
    })

    if (!client) {
      throw new Error("Client creation failed")
    }

    return res.status(201).json({
      message: "Client created successfully",
      clientId: client._id
    })

  } catch (error) {
    return res.status(400).json({
      message: error.message
    })
  }
}

const getClientsHandler = async (req, res) => {

  try {

    const clients = await getClients(req.tenantId)

    return res.status(200).json({
      clients
    })

  } catch (error) {

    return res.status(400).json({
      message: error.message
    })
    
  }
}

module.exports = { createClientHandler, getClientsHandler}
