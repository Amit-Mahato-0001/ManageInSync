const errorHandler = (err, req, res, next ) => {

    console.log(err.message)

    const status = err.statusCode || err.status || 500

    res.status(status).json({

        error: err.message || "Internal server error"
    })
}

module.exports = errorHandler
