const express = require('express')
const createTenantHandler = require('../controllers/tenant.controller')
const requireRole = require('../middleware/rbac.middleware')
const validate = require('../middleware/validate.middleware')
const { createTenantSchema } = require('../validators/tenant.validator')

const router = express.Router()

router.post(
    '/',
    requireRole(['owner']),
    validate(createTenantSchema, 'body'),
    createTenantHandler
)

module.exports = router
