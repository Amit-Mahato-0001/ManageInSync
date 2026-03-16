const { z } = require("zod")
const { objectId } = require("./common.validator")

const deleteMemberSchema = z.object({

    memberId: objectId("memberId")
})

module.exports = { deleteMemberSchema }
