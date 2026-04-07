const { z } = require("zod")
const { objectId, dateString } = require("./common.validator")

const createTaskSchema = z.object({

    title: z
    .string()
    .trim()
    .min(2, "Task title must be at least 2 characters")
    .max(200, "Task title is too long"),

    description: z
    .string()
    .trim()
    .min(2, "Task description must be at least 2 characters")
    .max(500, "Task description is too long")
    .optional(),

    targetDate: dateString("targetDate")
    .optional(),

    assigneeId: objectId("assigneeId"),

    status: z
    .enum(["todo", "in-progress", "done"])
    .default("todo"),

    priority: z
    .enum(["low", "medium", "high"])
    .default("medium")
})

const projectTaskParamsSchema = z.object({

    projectId: objectId("projectId")
    
})

const deleteTaskSchema = z.object({

    projectId: objectId("projectId"),
    taskId: objectId("taskId")

})

const updateTaskSchema = z.object({

    status: z
    .enum(["todo", "in-progress", "done"])
    .optional(),

    priority: z
    .enum(["low", "medium", "high"])
    .optional(),

    description: z
    .string()
    .trim()
    .min(2, "Task description must be at least 2 characters")
    .max(500, "Task description is too long")
    .optional(),

    targetDate: dateString("targetDate")
    .optional()

}).refine(
    
    (data) =>
        data.status !== undefined ||
        data.priority !== undefined ||
        data.description !== undefined ||
        data.targetDate !== undefined,

    {
        message: "Atleast one task field must be provided",
    }
)

module.exports = {
    createTaskSchema,
    projectTaskParamsSchema,
    deleteTaskSchema,
    updateTaskSchema
}
