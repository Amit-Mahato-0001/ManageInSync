const errorHandler = (err, req, res, next ) => {

    console.log(err.message)

    const status = err.statusCode || err.status || 500
    const message = err.message || "Internal server error"

    res.status(status).json({
        success: false,
        code: err.code || "internal_error",
        error: message,
        message,
        details: err.details
    })
}

module.exports = errorHandler
