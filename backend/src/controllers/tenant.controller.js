const createTenant = require('../services/tenant.service')

const createTenantHandler = async(req, res, next) => {

    try {
        
       const {name} = req.body

       if(!name || typeof name !== 'string'){

        return res.status(400).json({ message: 'Tenant name is required'})
       }

       const tenant = await createTenant({name})

       return res.status(201).json({
        message: 'Tenant created',
        tenantId: tenant._id

       })

    } catch (error) {
        
        next(error)
        
    }
}

module.exports = createTenantHandler
