const { z } = require("zod")
const { objectId } = require("./common.validator")

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

    memberIds: z
    .array(objectId("memberId"))
    .optional(),

    clientIds: z
    .array(objectId("clientId"))
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
    projectIdParamsSchema,
    deleteProjectSchema,
    assignProjectSchema,
    updateProjectStatusSchema,
    assignMemberSchema
}
