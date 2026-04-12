const express = require("express")
const authenticate = require("../middleware/auth.middleware")
const {
    signupHandler,
    loginHandler,
    refreshHandler,
    logoutHandler,
    logoutAllHandler
} = require("../controllers/auth.controller")
const router = express.Router()

const validate = require("../middleware/validate.middleware")

const { signupSchema, loginSchema } = require("../validators/auth.validator")

router.post(
    "/signup",
    validate(signupSchema, "body"),
    signupHandler
)

router.post(
    "/login",
    validate(loginSchema, "body"),
    loginHandler
)

router.post("/refresh", refreshHandler)
router.post("/logout", logoutHandler)
router.post("/logout-all", authenticate, logoutAllHandler)

module.exports = router
