const { z } = require("zod")

const objectId = (fieldName = "id") =>
  z.string().regex(/^[a-fA-F0-9]{24}$/, `Invalid ${fieldName}`)

const dateString = (fieldName = "date") =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${fieldName} must be in YYYY-MM-DD format`)
    .refine((value) => {
      const [year, month, day] = value.split("-").map(Number)
      const date = new Date(Date.UTC(year, month - 1, day))

      return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
      )
    }, `Invalid ${fieldName}`)

module.exports = { objectId, dateString }
