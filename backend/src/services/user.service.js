const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const User = require('../models/user.model')

const normalizeEmail = (value = "") =>
  typeof value === "string" ? value.trim().toLowerCase() : ""

const sanitizeOptionalString = (value = "") => {
  if (typeof value !== "string") {
    return undefined
  }

  const trimmedValue = value.trim()

  return trimmedValue || undefined
}

const createUser = async (data, options = {}) => {

  const { session } = options
  const safeEmail = normalizeEmail(data.email)

  if (!safeEmail || !data.password || !data.tenantId) {

    throw new Error('Missing required fields')
    
  }

  if (!mongoose.Types.ObjectId.isValid(data.tenantId)) {

    throw new Error('Invalid tenantId')
  }

  const existingUser = await User.findOne({

    email: safeEmail,
    tenantId: data.tenantId
    
  }).session(session || null)

  if (existingUser) {

    throw new Error('Email already exists in this tenant')
  }

  const hashedPassword = await bcrypt.hash(data.password, 12)

  const user = new User({
    email: safeEmail,
    name: sanitizeOptionalString(data.name),
    logoUrl: sanitizeOptionalString(data.logoUrl),
    password: hashedPassword,
    tenantId: data.tenantId,
    role: data.role,
    status: 'active'
  })

  await user.save({ session })
  return user
}

module.exports = createUser
