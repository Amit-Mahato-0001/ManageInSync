const { z } = require("zod")
const { objectId, dateString } = require("./common.validator")

const createProjectSchema = z.object({

    name: z
    .string()
    .trim()
    .min(2, "Project name must be at least 2 characters")
    .max(50, "Project name too long"),

    description: z
    .string()
    .trim()
    .min(2, "Description must be atleast 2 characters")
    .max(500, "Description too long")
    .optional(),

    targetDate: dateString("targetDate")
    .optional(),

    memberIds: z
    .array(objectId("memberId"))
    .optional(),

    clientIds: z
    .array(objectId("clientId"))
    .optional()
})

const listProjectsQuerySchema = z.object({

    page: z.coerce
    .number()
    .int()
    .min(1)
    .optional(),

    limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .optional(),

    search: z
    .string()
    .trim()
    .max(100, "Search is too long")
    .optional(),

    status: z
    .enum(["active", "completed", "on-hold"])
    .optional()
})

const projectIdParamsSchema = z.object({

    projectId: objectId("projectId")
})

const deleteProjectSchema = projectIdParamsSchema

const assignProjectSchema = z.object({

    clientIds: z
    .array(objectId("clientId"))

})

const updateProjectStatusSchema = z.object({

    status: z.enum(["active", "completed", "on-hold"])
})

const assignMemberSchema = z.object({

    memberIds: z
    .array(objectId("memberId"))

})

module.exports = {
    createProjectSchema,
    listProjectsQuerySchema,
    projectIdParamsSchema,
    deleteProjectSchema,
    assignProjectSchema,
    updateProjectStatusSchema,
    assignMemberSchema
}
