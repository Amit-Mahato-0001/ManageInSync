//req se tenantId nikalo
//tenantId exist? validation 
//database me tenant search kro
//tenant exist krta he check?
//tenant data req me attach
//req ko aage bhejo next()
//error handling
const Tenant = require('../models/tenant.model')

const resolveTenant = async (req, res, next) => {

    try {

        const tenantId = req.user?.tenantId //ager req.user nhi ho to app crash na ho (?.)

        if(!tenantId){
            return res.status(400).json({ message: "Tenant not found"})
        }

        const tenant = await Tenant.findById(tenantId)

        if(!tenant){
            return res.status(404).json({ message: "Tenant does not exists"})
        }

        req.tenant = tenant
        req.tenantId = tenant._id

        next()

    } catch (error) {
        console.error("TENANT RESOLUTION ERROR:", error.message)
        res.status(500).json({ message: "Tenant resolution failed"})
    }

}

module.exports = resolveTenant