const validate = (schema, source = "body") => (req, res, next) => {

  const data = req[source]

  const result = schema.safeParse(data)

  if (!result.success) {

    const issues = result.error.issues.map((issue) => ({

      path: issue.path.map(String),
      message: issue.message

    }))

    const errors = issues.reduce((accumulator, issue) => {

      const [field] = issue.path
      const key = field || "form"

      if (!accumulator[key]) {
        accumulator[key] = issue.message
      }

      return accumulator

    }, {})

    const message = result.error.issues[0]?.message || "Validation failed"

    return res.status(400).json({

      success: false,
      error: message,
      message,
      errors,
      issues

    })
    
  }

  req[source] = result.data

  next()
}

module.exports = validate
