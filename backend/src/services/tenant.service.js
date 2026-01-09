const Tenant = require('../models/tenant.model')

const createTenant = (data) => {
    return Tenant.create(data)
}

module.exports = createTenant