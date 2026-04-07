import toast from "react-hot-toast"

export const getErrorMessage = (error, fallback) => {

  return error?.response?.data?.message || error?.response?.data?.error || fallback

}

export const getValidationErrors = (error) => {

  const errors = error?.response?.data?.errors

  if (!errors || typeof errors !== "object") {

    return {}

  }

  return Object.entries(errors).reduce((accumulator, [field, value]) => {

    const message = Array.isArray(value) ? value[0] : value

    if (typeof message === "string" && message.trim()) {
      accumulator[field] = message
    }

    return accumulator

  }, {})

}

export const isValidationError = (error) => {

  return error?.response?.status === 400 && Object.keys(getValidationErrors(error)).length > 0

}

export const splitValidationErrors = (error) => {

  const validationErrors = { ...getValidationErrors(error) }
  const formError = validationErrors.form || ""

  delete validationErrors.form

  return {

    fieldErrors: validationErrors,
    formError

  }

}

export const runAsyncToast = async (

  action,
  { loadingMessage, successMessage, fallbackError, suppressErrorToast }

) => {

  const toastId = toast.loading(loadingMessage)

  try {

    const result = await action()

    if (successMessage) {

      toast.success(successMessage, { id: toastId })

    } else {

      toast.dismiss(toastId)

    }

    return result

  } catch (error) {

    if (suppressErrorToast?.(error)) {

      toast.dismiss(toastId)

    } else {

      toast.error(getErrorMessage(error, fallbackError), { id: toastId })

    }

    throw error
    
  }

}
