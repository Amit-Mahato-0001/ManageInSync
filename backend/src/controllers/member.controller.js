const { getMembers, deleteMember } = require("../services/member.service")
const {
  ACTIVITY_CATEGORIES,
  ACTIVITY_VISIBILITY,
  buildActorSnapshot,
  buildTargetUserSnapshot,
  recordActivity
} = require("../services/activity.service")

const getActorLabel = (user) => user?.email || "Someone"

const getMembersHandler = async (req, res, next) => {

  try {

    const members = await getMembers({
      tenantId: req.tenantId,
      includeInvited: req.query.includeInvited === "true"
    })

    res.status(200).json({ members })

  } catch (error) {
    
    next(error)
  }
  
}


const deleteMemberHandler = async (req, res, next) => {

  try {

    const { memberId } = req.params

    const result = await deleteMember({
      
      memberId,
      tenantId: req.tenantId
    })

    await recordActivity({
      tenantId: req.tenantId,
      type: "member.removed",
      category: ACTIVITY_CATEGORIES.TEAM,
      summary: `${getActorLabel(req.user)} removed member ${result.member.email}`,
      actor: buildActorSnapshot(req.user),
      targetUser: buildTargetUserSnapshot(result.member),
      visibility: ACTIVITY_VISIBILITY.ADMIN
    })

    res.status(200).json(result)

  } catch (error) {
    
    next(error)
  }

}

module.exports = { getMembersHandler, deleteMemberHandler }
