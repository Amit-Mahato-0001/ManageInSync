const { z } = require("zod")

const inviteUserSchema = z.object({

    email: z.string().trim().email("Invalid email"),
})

module.exports = { inviteUserSchema }
