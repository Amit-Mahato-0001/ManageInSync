import { formatDate } from "@/shared/utils/formatDate"

export const formatCurrency = (value) => {
  const amount = Number(value) || 0

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount)
}

export const formatInvoiceStatus = (value = "") =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

export const getInvoiceStatusClasses = (status) => {
  if (status === "paid") {
    return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
  }

  if (status === "overdue") {
    return "bg-rose-500/15 text-rose-300 border border-rose-500/20"
  }

  if (status === "draft") {
    return "bg-white/10 text-white/70 border border-white/10"
  }

  return "bg-amber-500/15 text-amber-300 border border-amber-500/20"
}

export const getBillingErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  fallback

export const getBillingValidationErrors = (error) => {
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

export const splitBillingValidationErrors = (error) => {
  const validationErrors = {
    ...getBillingValidationErrors(error)
  }
  const formError = validationErrors.form || ""

  delete validationErrors.form

  return {
    fieldErrors: validationErrors,
    formError
  }
}

export const getTodayInputValue = () => {
  const now = new Date()
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)

  return localTime.toISOString().slice(0, 10)
}

export const addDaysToInputValue = (value, days) => {
  const baseDate = value
    ? new Date(`${value}T00:00:00`)
    : new Date(`${getTodayInputValue()}T00:00:00`)

  if (Number.isNaN(baseDate.getTime())) {
    return getTodayInputValue()
  }

  baseDate.setDate(baseDate.getDate() + days)

  const year = baseDate.getFullYear()
  const month = `${baseDate.getMonth() + 1}`.padStart(2, "0")
  const day = `${baseDate.getDate()}`.padStart(2, "0")

  return `${year}-${month}-${day}`
}

export const calculateInvoicePreview = (items = []) => {
  const normalizedItems = items.map((item) => {
    const quantity = Number(item.quantity) || 0
    const unitPrice = Number(item.unitPrice) || 0
    const taxRate = Number(item.taxRate) || 0
    const lineTotal = quantity * unitPrice
    const taxAmount = (lineTotal * taxRate) / 100

    return {
      quantity,
      unitPrice,
      taxRate,
      lineTotal,
      taxAmount
    }
  })

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0)
  const taxTotal = normalizedItems.reduce((sum, item) => sum + item.taxAmount, 0)
  const total = subtotal + taxTotal

  return {
    subtotal,
    taxTotal,
    total
  }
}

export const formatInvoiceDate = formatDate
