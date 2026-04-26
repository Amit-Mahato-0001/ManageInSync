const { z } = require("zod")

const MAX_LOGO_LENGTH = 100000
const DATA_IMAGE_PATTERN = /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/

const isValidLogoValue = (value = "") => {
    if (!value) {
        return true
    }

    if (DATA_IMAGE_PATTERN.test(value)) {
        return true
    }

    try {
        new URL(value)
        return true
    } catch {
        return false
    }
}

const nameField = z.union([
    z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(80, "Name is too long"),
    z.literal("")
])

const logoUrlField = z.union([
    z
        .string()
        .trim()
        .max(MAX_LOGO_LENGTH, "Logo is too large")
        .refine(
            (value) => isValidLogoValue(value),
            "Logo must be a valid image URL or uploaded image"
        ),
    z.literal("")
])

const updateProfileSchema = z
    .object({
        name: nameField.optional(),
        logoUrl: logoUrlField.optional()
    })
    .refine(
        (value) => value.name !== undefined || value.logoUrl !== undefined,
        {
            message: "Provide at least one profile field to update",
            path: ["form"]
        }
    )

module.exports = { updateProfileSchema }
