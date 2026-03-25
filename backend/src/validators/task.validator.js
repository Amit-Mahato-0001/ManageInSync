const { z } = require("zod")
const { objectId } = require("./common.validator")

const createTaskSchema = z.object({

    title: z
    .string()
    .trim()
    .min(2, "Task title must be at least 2 characters")
    .max(200, "Task title is too long"),

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
    .string()
    .valid("todo", "in_progress", "completed").optional(),

    priority: z
    .string()
    .valid("low", "medium", "high").optional()

}).or("status", "priority") // atleast one must be present

module.exports = {
    createTaskSchema,
    projectTaskParamsSchema,
    deleteTaskSchema,
    updateTaskSchema
}
