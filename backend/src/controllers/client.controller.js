const { createClient, getClients, deleteClient } = require('../services/client.service')
const {
  ACTIVITY_CATEGORIES,
  ACTIVITY_VISIBILITY,
  buildActorSnapshot,
  buildTargetUserSnapshot,
  recordActivity
} = require("../services/activity.service")

const getActorLabel = (user) => user?.email || "Someone"

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

    await recordActivity({
      tenantId: req.tenantId,
      type: "client.created",
      category: ACTIVITY_CATEGORIES.CLIENT,
      summary: `${getActorLabel(req.user)} created client ${client.email}`,
      actor: buildActorSnapshot(req.user),
      targetUser: buildTargetUserSnapshot(client),
      visibility: ACTIVITY_VISIBILITY.ADMIN
    })

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

    const clients = await getClients({
      tenantId: req.tenantId,
      includeInvited: req.query.includeInvited === "true"
    })

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

    await recordActivity({
      tenantId: req.tenantId,
      type: "client.removed",
      category: ACTIVITY_CATEGORIES.CLIENT,
      summary: `${getActorLabel(req.user)} removed client ${result.client.email}`,
      actor: buildActorSnapshot(req.user),
      targetUser: buildTargetUserSnapshot(result.client),
      visibility: ACTIVITY_VISIBILITY.ADMIN
    })
    
    res.json(result)

  } catch (error) {
    
    next(error)
    
  }

}

module.exports = { createClientHandler, getClientsHandler, deleteClientHandler}
