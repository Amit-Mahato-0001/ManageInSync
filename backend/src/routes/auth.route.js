const express = require("express")
const authenticate = require("../middleware/auth.middleware")
const {
    signupHandler,
    loginHandler,
    forgotPasswordHandler,
    resetPasswordHandler,
    refreshHandler,
    logoutHandler,
    logoutAllHandler,
    changePasswordHandler
} = require("../controllers/auth.controller")
const router = express.Router()

const validate = require("../middleware/validate.middleware")
const { createRateLimiter } = require("../middleware/rateLimit.middleware")

const {
    signupSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema
} = require("../validators/auth.validator")
const authRateLimiter = createRateLimiter({
    windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 10 * 60 * 1000,
    max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
    message: "Too many authentication requests. Please try again later.",
    code: "auth_rate_limit_exceeded"
})

router.post(
    "/signup",
    authRateLimiter,
    validate(signupSchema, "body"),
    signupHandler
)

router.post(
    "/login",
    authRateLimiter,
    validate(loginSchema, "body"),
    loginHandler
)

router.post(
    "/forgot-password",
    authRateLimiter,
    validate(forgotPasswordSchema, "body"),
    forgotPasswordHandler
)

router.post(
    "/reset-password",
    authRateLimiter,
    validate(resetPasswordSchema, "body"),
    resetPasswordHandler
)

router.post("/refresh", authRateLimiter, refreshHandler)
router.post("/logout", authRateLimiter, logoutHandler)
router.post("/logout-all", authRateLimiter, authenticate, logoutAllHandler)
router.post(
    "/change-password",
    authRateLimiter,
    authenticate,
    validate(changePasswordSchema, "body"),
    changePasswordHandler
)

module.exports = router
