const ONE_YEAR_IN_SECONDS = 31536000
const GOOGLE_FONTS_STYLES_ORIGIN = "https://fonts.googleapis.com"
const GOOGLE_FONTS_FONT_ORIGIN = "https://fonts.gstatic.com"
const RAZORPAY_CHECKOUT_ORIGIN = "https://checkout.razorpay.com"
const RAZORPAY_API_ORIGIN = "https://api.razorpay.com"

const PRODUCTION_CSP_DIRECTIVES = {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "connect-src": [
        "'self'",
        RAZORPAY_API_ORIGIN,
        RAZORPAY_CHECKOUT_ORIGIN
    ],
    "font-src": ["'self'", GOOGLE_FONTS_FONT_ORIGIN],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "frame-src": ["'self'", RAZORPAY_CHECKOUT_ORIGIN],
    "img-src": ["'self'", "data:", "blob:"],
    "manifest-src": ["'self'"],
    "object-src": ["'none'"],
    "script-src": ["'self'", RAZORPAY_CHECKOUT_ORIGIN],
    "style-src": [
        "'self'",
        "'unsafe-inline'",
        GOOGLE_FONTS_STYLES_ORIGIN
    ],
    "worker-src": ["'self'", "blob:"],
    "upgrade-insecure-requests": []
}

const buildContentSecurityPolicy = () =>
    Object.entries(PRODUCTION_CSP_DIRECTIVES)
        .map(([directive, sources]) =>
            sources.length > 0
                ? `${directive} ${sources.join(" ")}`
                : directive
        )
        .join("; ")

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
        res.setHeader("Content-Security-Policy", buildContentSecurityPolicy())
        res.setHeader(
            "Strict-Transport-Security",
            `max-age=${ONE_YEAR_IN_SECONDS}; includeSubDomains`
        )
    }

    next()
}

module.exports = securityHeaders
