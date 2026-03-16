const express = require('express')
const {signupHandler, loginHandler} = require('../controllers/auth.controller')
const router = express.Router()

const validate = require("../middleware/validate.middleware")

const { signupSchema, loginSchema} = require("../validators/auth.validator")

router.post(
    '/signup', 
    validate(signupSchema, "body"), 
    signupHandler)
    
router.post(
    '/login', 
    validate(loginSchema, "body"), 
    loginHandler)

module.exports = router