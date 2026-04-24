const Tenant = require('../models/tenant.model')
const { slugifyWorkspaceName } = require("../utils/workspace")

const buildNameLookup = (name) => ({
    name: {
        $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i"
    }
})

const resolveUniqueWorkspaceSlug = async ({ name, session }) => {
    const baseSlug = slugifyWorkspaceName(name)

    for (let attempt = 0; attempt < 25; attempt += 1) {
        const nextSlug =
            attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`

        const existingTenant = await Tenant.findOne({
            slug: nextSlug
        }).session(session || null)

        if (!existingTenant) {
            return nextSlug
        }
    }

    return `${baseSlug}-${Date.now().toString().slice(-6)}`
}

const createTenant = async (data, options = {}) => {

    const { session } = options
    const safeName = data.name?.trim()

    const existingTenant = await Tenant.findOne(buildNameLookup(safeName)).session(session || null)

    if(existingTenant){

        throw new Error('Tenant already exists')
    }

    const slug = await resolveUniqueWorkspaceSlug({
        name: safeName,
        session
    })

    const tenant = new Tenant({

        name: safeName,
        slug
    })

    await tenant.save({ session })
    
    return tenant
}

module.exports = createTenant
