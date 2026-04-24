const nodemailer = require("nodemailer")

const buildFrontendUrl = ({ pathname, params = {} }) => {
    const url = new URL(pathname, process.env.FRONTEND_URL)

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
            return
        }

        url.searchParams.set(key, String(value))
    })

    return url.toString()
}

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

const buildInviteLink = ({ inviteToken, workspace }) =>
    buildFrontendUrl({
        pathname: "/accept-invite",
        params: {
            token: inviteToken,
            workspace
        }
    })

const buildPasswordResetLink = ({ resetToken, workspace }) =>
    buildFrontendUrl({
        pathname: "/reset-password",
        params: {
            token: resetToken,
            workspace
        }
    })

const getEmailFromAddress = () =>
    process.env.EMAIL_FROM || `"ManageInSync" <${process.env.EMAIL_USER}>`

const sendInviteEmail = async ({ to, inviteToken, workspace}) => {
    const inviteLink = buildInviteLink({ inviteToken, workspace })
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

const sendPasswordResetEmail = async ({ to, resetToken, workspace }) => {
    const resetLink = buildPasswordResetLink({ resetToken, workspace })
    const transporter = nodemailer.createTransport(getEmailTransportConfig())

    await transporter.sendMail({
        from: getEmailFromAddress(),
        to,
        subject: "Reset your ManageInSync password",
        html: `
        <p>We received a request to reset your password.</p>
        <p>Click the link below to choose a new password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link expires in 1 hour.</p>
        <p>If you did not request this, you can ignore this email.</p>
        `
    })
}

module.exports = {
    buildInviteLink,
    buildPasswordResetLink,
    getEmailFromAddress,
    getEmailTransportConfig,
    sendInviteEmail,
    sendPasswordResetEmail
}
