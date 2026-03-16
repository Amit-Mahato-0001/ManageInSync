const { z } = require("zod")

const createUserSchema = z.object({

    email: z
    .string()
    .trim()
    .email("Invalid email"),

    password: z
    .string()
    .min(8, "Password must be at least 8 characters")
})

module.exports = { createUserSchema }
