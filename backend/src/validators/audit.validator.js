const { z } = require("zod")

const auditListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    search: z
        .string()
        .trim()
        .max(100, "Search text is too long")
        .optional()
})

module.exports = {
    auditListQuerySchema
}
