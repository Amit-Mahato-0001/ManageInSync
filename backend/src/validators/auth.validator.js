const { z } = require("zod")

const signupSchema = z.object({

    agencyName: z
    .string()
    .trim()
    .min(2, "Agency name is required"),

    email: z
    .string()
    .trim()
    .email("Invalid email"),

    password: z
    .string()
    .min(8, "Password must be at least 8 characters")
})

const loginSchema = z.object({

    email: z
    .string()
    .trim()
    .email("Invalid email"),

    password: z
    .string()
    .min(8, "Password must be at least 8 characters")
})

const acceptInviteSchema = z.object({

    token: z
    .string()
    .trim()
    .min(1, "Invite token required"),

    password: z
    .string()
    .min(8, "Password must be at least 8 characters")
})

module.exports = {

    signupSchema,
    loginSchema,
    acceptInviteSchema
}
