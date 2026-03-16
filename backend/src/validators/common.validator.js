const { z } = require("zod")

const objectId = (fieldName = "id") =>
  z.string().regex(/^[a-fA-F0-9]{24}$/, `Invalid ${fieldName}`)

module.exports = { objectId }
