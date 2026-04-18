const nodemailer = require("nodemailer")

const parseBooleanValue = (value, fallback = false) => {
    if (typeof value !== "string" || !value.trim()) {
        return fallback
    }

    return value.trim().toLowerCase() === "true"
}

const getEmailTransportConfig = () => {
    const port = Number(process.env.EMAIL_PORT)
    const secure =
        typeof process.env.EMAIL_SECURE === "string"
            ? parseBooleanValue(process.env.EMAIL_SECURE)
            : port === 465

    return {
        host: process.env.EMAIL_HOST,
        port,
        secure,
        requireTLS: parseBooleanValue(process.env.EMAIL_REQUIRE_TLS, !secure),
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    }
}

const buildInviteLink = ({ inviteToken }) =>
    `${process.env.FRONTEND_URL}/accept-invite?token=${encodeURIComponent(inviteToken)}`

const getEmailFromAddress = () =>
    process.env.EMAIL_FROM || `"ManageInSync" <${process.env.EMAIL_USER}>`

const sendInviteEmail = async ({ to, inviteToken}) => {
    const inviteLink = buildInviteLink({ inviteToken })
    const transporter = nodemailer.createTransport(getEmailTransportConfig())

    await transporter.sendMail({

        from: getEmailFromAddress(),
        to,
        subject: "You're invited to ManageInSync",
        html: `
        <p>You have been invited to join an agency.</p>
        <p>Click the link below to set your password:</p>
        <a href="${inviteLink}">${inviteLink}</a>
        <p>This link expires in 24 hours.</p>
        `
    })
}

module.exports = {
    buildInviteLink,
    getEmailFromAddress,
    getEmailTransportConfig,
    sendInviteEmail
}
