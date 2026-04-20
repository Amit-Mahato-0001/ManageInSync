import api from "@/shared/api/axios"

export const fetchInvoices = (params) => {
  return api.get("/billing/invoices", { params })
}

export const createInvoice = (data) => {
  return api.post("/billing/invoices", data)
}

export const fetchInvoiceDetail = (invoiceId) => {
  return api.get(`/billing/invoices/${invoiceId}`)
}

export const issueInvoice = (invoiceId) => {
  return api.post(`/billing/invoices/${invoiceId}/issue`)
}

export const createInvoiceCheckoutOrder = (invoiceId) => {
  return api.post(`/billing/invoices/${invoiceId}/checkout-order`)
}

export const verifyInvoicePayment = (invoiceId, data) => {
  return api.post(`/billing/invoices/${invoiceId}/payments/verify`, data)
}

export const payInvoice = (invoiceId, data) => {
  return api.post(`/billing/invoices/${invoiceId}/payments`, data)
}
