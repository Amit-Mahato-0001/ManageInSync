const User = require("../models/user.model")

const getMembers = async (tenantId) => {

  if (!tenantId) {

    throw new Error("tenantId required")

  }

  return await User.find({
    tenantId,
    role: "member",
    status: "active"
  }).select("email role status")
}

const deleteMember = async ({ memberId, tenantId }) => {

  if (!tenantId) {

    throw new Error("tenantId required")

  }

  const member = await User.findOneAndDelete({
    
    _id: memberId,
    tenantId,
    role: "member",
    status: "active"

  })

  if (!member) {
    throw new Error("Member not found")
  }

  return { message: "Member deleted successfully" }
}

module.exports = { getMembers, deleteMember }
