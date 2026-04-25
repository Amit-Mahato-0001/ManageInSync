const User = require("../models/user.model")
const Project = require("../models/project.model")
const createHttpError = require("../utils/httpError")

const getMembers = async ({ tenantId, includeInvited = false }) => {

  if (!tenantId) {

    throw new Error("tenantId required")

  }

  return await User.find({
    tenantId,
    role: "member",
    status: includeInvited ? { $in: ["active", "invited"] } : "active"
  })
    .select("email role createdAt")
    .sort({ createdAt: -1 })
}

const deleteMember = async ({ memberId, tenantId }) => {

  if (!tenantId) {

    throw new Error("tenantId required")

  }

  const member = await User.findOneAndDelete({
    
    _id: memberId,
    tenantId,
    role: "member",
    status: { $in: ["active", "invited"] }

  })

  if (!member) {
    throw createHttpError("Member not found", 404, "member_not_found")
  }

  await Project.updateMany(
    {
      tenantId,
      deletedAt: null,
      members: member._id
    },
    {
      $pull: {
        members: member._id
      }
    }
  )

  return {
    message: "Member deleted successfully",
    member
  }
}

module.exports = { getMembers, deleteMember }
