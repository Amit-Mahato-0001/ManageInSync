const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({

    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

const sendInviteEmail = async ({ to, inviteToken}) => {

    const inviteLink = `${process.env.FRONTEND_URL}/accept-invite?token=${inviteToken}`

    await transporter.sendMail({

        from: `"ManageInSync" <${process.env.EMAIL_USER}>`,
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

module.exports = { sendInviteEmail }