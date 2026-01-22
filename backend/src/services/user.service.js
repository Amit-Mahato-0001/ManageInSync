const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const User = require('../models/user.model')

const createUser = async (data) => {
  if (!data.email || !data.password || !data.tenantId) {
    throw new Error('Missing required fields')
  }

  if (!mongoose.Types.ObjectId.isValid(data.tenantId)) {
    throw new Error('Invalid tenantId')
  }

  const existingUser = await User.findOne({ email: data.email })
  if (existingUser) {
    throw new Error('Email already exists')
  }

  const hashedPassword = await bcrypt.hash(data.password, 12)

  return User.create({
    email: data.email,
    password: hashedPassword,
    tenantId: data.tenantId,
    role: data.role,
    status: 'active'
  })
}

module.exports = createUser
