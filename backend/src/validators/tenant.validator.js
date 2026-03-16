const { z } = require("zod")

const createTenantSchema = z.object({

    name: z
    .string()
    .trim()
    .min(2, "Tenant name must be at least 2 characters")
    .max(100, "Tenant name too long")
})

module.exports = { createTenantSchema }
