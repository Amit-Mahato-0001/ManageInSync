const createHttpError = (message, status = 500, code = "internal_error", details) => {
    const error = new Error(message)

    error.status = status
    error.statusCode = status
    error.code = code

    if (details !== undefined) {
        error.details = details
    }

    return error
}

module.exports = createHttpError
