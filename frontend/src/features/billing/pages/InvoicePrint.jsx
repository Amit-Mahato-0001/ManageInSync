import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"

import authApi from "@/features/auth/api/auth"
import { fetchInvoiceDetail } from "../api/billing"
import {
  formatCurrency,
  formatInvoiceDate,
  formatInvoiceStatus
} from "../utils/billingUtils"

const MetaItem = ({ label, value }) => {
  return (
    <div>
      <p className="text-2xl font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-medium text-slate-700">{value}</p>
    </div>
  )
}

const SummaryRow = ({ label, value, emphasized }) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-2xl text-slate-500">{label}</span>
      <span className={emphasized ? "text-2xl font-semibold text-slate-900" : "text-2xl text-slate-700"}>
        {value}
      </span>
    </div>
  )
}

const InvoicePrint = () => {
  const { invoiceId } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [tenantName, setTenantName] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const hasTriggeredPrint = useRef(false)

  const loadInvoice = useCallback(async () => {
    try {
      setLoading(true)

      const [invoiceResult, meResult] = await Promise.allSettled([
        fetchInvoiceDetail(invoiceId),
        authApi.meApi()
      ])

      if (invoiceResult.status !== "fulfilled") {
        throw invoiceResult.reason
      }

      setInvoice(invoiceResult.value.data.invoice)
      setTenantName(
        meResult.status === "fulfilled"
          ? meResult.value.data?.tenant?.name || ""
          : ""
      )
      setError("")
    } catch (requestError) {
      console.error(requestError)
      setError(
        requestError?.response?.data?.message ||
          requestError?.response?.data?.error ||
          "Failed to load print view"
      )
    } finally {
      setLoading(false)
    }
  }, [invoiceId])

  useEffect(() => {
    loadInvoice()
  }, [loadInvoice])

  useEffect(() => {
    if (!invoice || hasTriggeredPrint.current) {
      return
    }

    hasTriggeredPrint.current = true

    window.setTimeout(() => {
      window.print()
    }, 150)
  }, [invoice])

  if (loading) {
    return <p className="p-6">Loading invoice...</p>
  }

  if (error) {
    return <p className="p-6 text-red-500">{error}</p>
  }

  if (!invoice) {
    return <p className="p-6">Invoice not found</p>
  }

  const companyLabel = tenantName || "Agency Workspace"

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-8 print:px-0 print:py-0">
        <div className="mb-8 flex items-center justify-between print:hidden">
          <Link
            to={`/billing/${invoice._id}`}
            className="rounded-lg border border-slate-200 px-4 py-2 text-2xl font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Back to invoice
          </Link>

          <button
            onClick={() => window.print()}
            className="rounded-lg border border-slate-200 px-4 py-2 text-2xl font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Print again
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-2xl font-medium uppercase tracking-[0.25em] text-slate-500">
                Invoice
              </p>
              <h1 className="mt-3 text-5xl font-semibold text-slate-900">
                {invoice.invoiceNumber}
              </h1>
              <p className="mt-3 text-2xl text-slate-500">
                Status: {formatInvoiceStatus(invoice.status)}
              </p>
            </div>

            <div className="grid gap-6 text-2xl md:grid-cols-2">
              <div>
                <p className="font-semibold text-slate-900">From</p>
                <p className="mt-2 text-slate-600">{companyLabel}</p>
                <p className="mt-1 text-slate-500">Owner-managed billing workspace</p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">Bill To</p>
                <p className="mt-2 text-slate-600">
                  {invoice.contactSnapshot?.name}
                </p>
                <p className="mt-1 text-slate-500">
                  {invoice.contactSnapshot?.email}
                </p>
                {invoice.contactSnapshot?.companyName && (
                  <p className="mt-1 text-slate-500">
                    {invoice.contactSnapshot.companyName}
                  </p>
                )}
                {invoice.contactSnapshot?.address && (
                  <p className="mt-1 whitespace-pre-line text-slate-500">
                    {invoice.contactSnapshot.address}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 rounded-2xl bg-slate-50 p-5 text-2xl text-slate-600 md:grid-cols-4">
            <MetaItem label="Issue Date" value={formatInvoiceDate(invoice.issueDate)} />
            <MetaItem label="Due Date" value={formatInvoiceDate(invoice.dueDate)} />
            <MetaItem label="Reference" value={invoice.reference || "Not provided"} />
            <MetaItem label="Amount Due" value={formatCurrency(invoice.amountDue)} />
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full text-left text-2xl">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Item</th>
                  <th className="px-5 py-4 font-medium">Qty</th>
                  <th className="px-5 py-4 font-medium">Unit Price</th>
                  <th className="px-5 py-4 font-medium">Tax</th>
                  <th className="px-5 py-4 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item) => (
                  <tr key={item._id} className="border-t border-slate-200">
                    <td className="px-5 py-4 font-medium text-slate-900">{item.itemName}</td>
                    <td className="px-5 py-4 text-slate-600">{item.quantity}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{item.taxRate}%</td>
                    <td className="px-5 py-4 text-slate-900">
                      {formatCurrency(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-10 flex justify-end">
            <div className="w-full max-w-sm space-y-3 rounded-2xl bg-slate-50 p-5">
              <SummaryRow label="Subtotal" value={formatCurrency(invoice.subtotal)} />
              <SummaryRow label="Tax Total" value={formatCurrency(invoice.taxTotal)} />
              <SummaryRow label="Amount Paid" value={formatCurrency(invoice.amountPaid)} />
              <SummaryRow label="Amount Due" value={formatCurrency(invoice.amountDue)} />
              <div className="border-t border-slate-200 pt-3">
                <SummaryRow
                  label="Total"
                  value={formatCurrency(invoice.total)}
                  emphasized
                />
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-10 rounded-2xl border border-slate-200 p-5">
              <p className="text-2xl font-semibold text-slate-900">Notes</p>
              <p className="mt-3 whitespace-pre-line text-2xl text-slate-600">
                {invoice.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InvoicePrint
