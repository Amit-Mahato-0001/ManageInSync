const { z } = require("zod")
const { objectId } = require("./common.validator")

const createClientSchema = z.object({

    email: z.string().trim().email("Invalid email"),

    name: z
    .string()
    .trim()
    .min(2, "Name must be atleast 2 characters")
    .max(50, "Name too long")
})

const deleteClientSchema = z.object({

    clientId: objectId("clientId")

})

module.exports = { createClientSchema, deleteClientSchema}
