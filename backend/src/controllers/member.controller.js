const { getMembers, deleteMember } = require("../services/member.service")

const getMembersHandler = async (req, res, next) => {

  try {

    const members = await getMembers(req.tenantId)

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

    res.status(200).json(result)

  } catch (error) {
    
    next(error)

  }

}

module.exports = { getMembersHandler, deleteMemberHandler }