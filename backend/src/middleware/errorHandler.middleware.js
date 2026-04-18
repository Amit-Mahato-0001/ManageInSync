const errorHandler = (err, req, res, next ) => {
    const status = err.statusCode || err.status || 500
    const isProduction = process.env.NODE_ENV === "production"
    const isTest = process.env.NODE_ENV === "test"
    const isServerError = status >= 500

    if (isServerError) {
        console.error(err.stack || err.message)
    } else if (!isTest) {
        console.warn(err.message)
    }

    const message =
        isProduction && isServerError
            ? "Internal server error"
            : err.message || "Internal server error"

    res.status(status).json({
        success: false,
        code: err.code || "internal_error",
        error: message,
        message,
        details:
            isProduction && isServerError
                ? undefined
                : err.details
    })
}

module.exports = errorHandler
