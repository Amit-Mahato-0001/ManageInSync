const mongoose = require("mongoose")
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

  if (!memberId || !tenantId) {
    throw new Error("memberId & tenantId required")
  }

  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    throw new Error("Invalid memberId")
  }

  const member = await User.findOne({
    _id: memberId,
    tenantId,
    role: "member",
    status: "active"

  })

  if (!member) {
    throw new Error("Member not found")
  }

  await User.deleteOne({
    _id: memberId,
    tenantId,
    role: "member"
  })

  return { message: "Member deleted successfully" }
}

module.exports = { getMembers, deleteMember }
