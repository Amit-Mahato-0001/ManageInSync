const { z } = require("zod")

const objectIdSchema = z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid projectId")

const uploadUrlParamsSchema = z.object({
    projectId: objectIdSchema
})

const projectFileParamsSchema = z.object({
    projectId: objectIdSchema,
    fileId: objectIdSchema
})

const listProjectFilesQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10)
    ,
    folder: z.string().trim().max(250).optional()
})

const createUploadUrlSchema = z.object({
    fileName: z
        .string()
        .trim()
        .min(1, "File name is required")
        .max(255, "File name is too long"),
    mimeType: z
        .string()
        .trim()
        .min(1, "MIME type is required")
        .max(120, "MIME type is too long"),
    fileSize: z
        .number({
            error: "File size is required"
        })
        .int("File size must be a whole number")
        .min(1, "File size must be greater than 0")
    ,
    folder: z
        .string()
        .trim()
        .max(250, "Folder name is too long")
        .optional()
})

const uploadFileQuerySchema = z.object({
    fileName: z
        .string()
        .trim()
        .min(1, "File name is required")
        .max(255, "File name is too long"),
    mimeType: z
        .string()
        .trim()
        .min(1, "MIME type is required")
        .max(120, "MIME type is too long")
})

module.exports = {
    createUploadUrlSchema,
    listProjectFilesQuerySchema,
    projectFileParamsSchema,
    uploadFileQuerySchema,
    uploadUrlParamsSchema
}
