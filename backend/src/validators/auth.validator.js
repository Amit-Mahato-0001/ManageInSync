const { z } = require("zod")

const workspaceSchema = z
    .string()
    .trim()
    .min(2, "Workspace is required")
    .max(100, "Workspace is too long")

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
    workspace: workspaceSchema,

    email: z
    .string()
    .trim()
    .email("Invalid email"),

    password: z
    .string()
    .min(8, "Password must be at least 8 characters")
})

const forgotPasswordSchema = z.object({
    workspace: workspaceSchema,
    email: z
        .string()
        .trim()
        .email("Invalid email")
})

const resetPasswordSchema = z.object({
    token: z
        .string()
        .trim()
        .min(1, "Reset token required"),
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

const changePasswordSchema = z
    .object({
        currentPassword: z
            .string()
            .min(8, "Current password must be at least 8 characters"),
        newPassword: z
            .string()
            .min(8, "New password must be at least 8 characters")
    })
    .refine(
        (data) => data.currentPassword !== data.newPassword,
        {
            message: "New password must be different from current password",
            path: ["newPassword"]
        }
    )

module.exports = {

    signupSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    acceptInviteSchema
}
