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

const deleteTaskSchema = z.object({
    
    taskId: objectId("taskId")
})

module.exports = {
    createTaskSchema,
    deleteTaskSchema
}
