const express = require("express")

const validate = require("../middleware/validate.middleware")
const {
    getAccountProfileHandler,
    listActiveSessionsHandler,
    updateAccountProfileHandler
} = require("../controllers/account.controller")
const { updateProfileSchema } = require("../validators/account.validator")

const router = express.Router()

router.get("/profile", getAccountProfileHandler)
router.patch(
    "/profile",
    validate(updateProfileSchema, "body"),
    updateAccountProfileHandler
)
router.get("/sessions", listActiveSessionsHandler)

module.exports = router
