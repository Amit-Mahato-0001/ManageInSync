//req se tenantId nikalo
//tenantId exist? validation 
//database me tenant search kro
//tenant exist krta he check?
//tenant data req me attach
//req ko aage bhejo next()
//error handling
const Tenant = require('../models/tenant.model')
const { timeProfileStep } = require("../utils/requestProfiler")

const resolveTenant = async (req, res, next) => {

    try {

        const tenantId = req.user?.tenantId //ager req.user nhi ho to app crash na ho (?.)

        if(!tenantId){
            return res.status(400).json({ message: "Tenant not found"})
        }

        const tenant = await timeProfileStep("tenant.lookup", async () => {
            const tenantQuery = Tenant.findById(tenantId)

            return typeof tenantQuery.select === "function"
                ? tenantQuery
                    .select("name slug logoUrl plan")
                    .lean()
                : tenantQuery
        })

        if(!tenant){
            return res.status(404).json({ message: "Tenant does not exists"})
        }

        req.tenant = tenant
        req.tenantId = tenant._id

        next()

    } catch (error) {

        next(error)
    }

}

module.exports = resolveTenant
