const express = require('express')
const createUserHandler = require('../controllers/user.controller')
const requireRole = require('../middleware/rbac.middleware')
const validate = require('../middleware/validate.middleware')
const { createUserSchema } = require('../validators/user.validator')

const router = express.Router()

router.post(
    '/',
    requireRole(['owner', 'admin']),
    validate(createUserSchema, 'body'),
    createUserHandler
)

module.exports = router
