const ONE_YEAR_IN_SECONDS = 31536000

const securityHeaders = () => (req, res, next) => {
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")
    res.setHeader("X-Content-Type-Options", "nosniff")
    res.setHeader("X-Frame-Options", "DENY")
    res.setHeader("X-DNS-Prefetch-Control", "off")
    res.setHeader(
        "Permissions-Policy",
        "camera=(), geolocation=(), microphone=(), payment=(self)"
    )
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin")
    res.setHeader("Cross-Origin-Resource-Policy", "same-site")

    if (process.env.NODE_ENV === "production") {
        res.setHeader(
            "Strict-Transport-Security",
            `max-age=${ONE_YEAR_IN_SECONDS}; includeSubDomains`
        )
    }

    next()
}

module.exports = securityHeaders
