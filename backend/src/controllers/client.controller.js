const { createClient, getClients, deleteClient } = require('../services/client.service')

const createClientHandler = async (req, res, next) => {

  try {
    const { email, name } = req.body

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
    
    next(error)
  }
}

const getClientsHandler = async (req, res, next) => {

  try {

    const clients = await getClients(req.tenantId)

    return res.status(200).json({
      clients
    })

  } catch (error) {

    next(error)
    
  }
}

const deleteClientHandler = async (req, res, next) => {

  try {
    
    const { clientId } = req.params

    const result = await deleteClient({

      clientId,
      tenantId: req.tenantId

    })
    
    res.json(result)

  } catch (error) {
    
    next(error)
    
  }

}

module.exports = { createClientHandler, getClientsHandler, deleteClientHandler}
