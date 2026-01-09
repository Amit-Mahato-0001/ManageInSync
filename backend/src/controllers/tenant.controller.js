const createTenant = require('../services/tenant.service')

const createTenantHandler = async(req, res) => {
    try {
        //validate the data
        if(!req.body.name){
            return res.status(400).json({ message: "Agency name required"})
        }
        //tenant name from input
        const tenantData = {
            name: req.body.name
        }
        // tenant create 
        const tenant = await createTenant(tenantData)
        res.status(201).json(tenant)

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports = createTenantHandler