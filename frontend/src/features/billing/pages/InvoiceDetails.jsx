import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import toast from "react-hot-toast"
import { ArrowLeft } from "lucide-react"

import authApi from "@/features/auth/api/auth"
import {
  createInvoiceCheckoutOrder,
  fetchInvoiceDetail,
  issueInvoice,
  verifyInvoicePayment
} from "../api/billing"
import { useAuth } from "@/features/auth/hooks/useAuth"
import {
  formatCurrency,
  formatInvoiceDate,
  formatInvoiceStatus,
  getBillingErrorMessage,
  getInvoiceStatusClasses
} from "../utils/billingUtils"

const getRazorpayMode = (checkout) => {
  if (checkout?.mode === "live" || checkout?.mode === "test") {
    return checkout.mode
  }

  return String(checkout?.keyId || "").startsWith("rzp_live_") ? "live" : "test"
}

const RAZORPAY_CHECKOUT_URL = "https://checkout.razorpay.com/v1/checkout.js"

const InfoCard = ({ title, children }) => {
  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-6">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

const SummaryRow = ({ label, value, emphasized }) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-2xl text-white/55">{label}</span>
      <span className={emphasized ? "text-2xl font-semibold text-white" : "text-2xl text-white"}>
        {value}
      </span>
    </div>
  )
}

const loadRazorpayCheckout = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay)
      return
    }

    const existingScript = document.querySelector('script[data-razorpay-checkout="true"]')

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.Razorpay), {
        once: true
      })
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Razorpay checkout")),
        { once: true }
      )
      return
    }

    const script = document.createElement("script")
    script.src = RAZORPAY_CHECKOUT_URL
    script.async = true
    script.dataset.razorpayCheckout = "true"
    script.onload = () => resolve(window.Razorpay)
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout"))
    document.body.appendChild(script)
  })

const InvoiceDetails = () => {
  const { invoiceId } = useParams()
  const { user } = useAuth()
  const [invoice, setInvoice] = useState(null)
  const [tenantName, setTenantName] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionLoading, setActionLoading] = useState("")

  const loadInvoice = useCallback(async ({ showLoader = true } = {}) => {
    try {
      if (showLoader) {
        setLoading(true)
      }

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
      setError(getBillingErrorMessage(requestError, "Failed to load invoice"))
    } finally {
      if (showLoader) {
        setLoading(false)
      }
    }
  }, [invoiceId])

  useEffect(() => {
    loadInvoice()
  }, [loadInvoice])

  const handleIssueInvoice = async () => {
    if (!window.confirm("Issue this invoice now?")) {
      return
    }

    const toastId = toast.loading("Issuing invoice...")

    try {
      setActionLoading("issue")
      const response = await issueInvoice(invoiceId)
      setInvoice(response.data.invoice)
      toast.success("Invoice issued", { id: toastId })
    } catch (requestError) {
      console.error(requestError)
      toast.error(
        getBillingErrorMessage(requestError, "Failed to issue invoice"),
        { id: toastId }
      )
    } finally {
      setActionLoading("")
    }
  }

  const handlePayInvoice = async () => {
    try {
      setActionLoading("pay")

      await loadRazorpayCheckout()

      const orderResponse = await createInvoiceCheckoutOrder(invoiceId)
      const checkout = orderResponse.data?.checkout

      if (!checkout?.orderId || !checkout?.keyId || !window.Razorpay) {
        throw new Error("Unable to initialize Razorpay checkout")
      }

      const razorpayMode = getRazorpayMode(checkout)

      if (razorpayMode === "test") {
        toast(
          "Razorpay test mode is active. Use Razorpay test UPI or card details. Real payments require live keys."
        )
      }

      const razorpay = new window.Razorpay({
        key: checkout.keyId,
        amount: checkout.amount,
        currency: checkout.currency,
        name: checkout.name,
        description: checkout.description,
        order_id: checkout.orderId,
        prefill: checkout.prefill,
        notes: checkout.notes,
        theme: {
          color: "#2563EB"
        },
        modal: {
          ondismiss: () => {
            setActionLoading("")
          }
        },
        handler: async (paymentResponse) => {
          const toastId = toast.loading("Verifying payment...")

          try {
            const verificationResponse = await verifyInvoicePayment(
              invoiceId,
              paymentResponse
            )

            setInvoice(verificationResponse.data.invoice)
            toast.success("Payment successful", { id: toastId })
          } catch (requestError) {
            console.error(requestError)
            toast.error(
              getBillingErrorMessage(requestError, "Payment verification failed"),
              { id: toastId }
            )
          } finally {
            setActionLoading("")
          }
        }
      })

      razorpay.on("payment.failed", (event) => {
        const failureDescription =
          event?.error?.description ||
          event?.error?.reason ||
          "Payment failed. Please try again."
        const errorText = String(failureDescription).trim()
        const errorCode = String(event?.error?.code || "").trim()
        const isAuthenticationFailure =
          /authentication failed/i.test(errorText) ||
          /BAD_REQUEST_ERROR/i.test(errorCode)
        const message =
          razorpayMode === "test" && isAuthenticationFailure
            ? `${errorText} Real payments do not work in test mode. Use Razorpay test payment details or configure live keys.`
            : errorText

        toast.error(message)
        setActionLoading("")
      })

      razorpay.open()
    } catch (requestError) {
      console.error(requestError)
      toast.error(getBillingErrorMessage(requestError, "Failed to start Razorpay checkout"))
      setActionLoading("")
    } finally {
      // Checkout stays open asynchronously, so action state is cleared by handler/ondismiss.
    }
  }

  if (loading) {
    return <p>Loading invoice...</p>
  }

  if (error) {
    return <p className="text-red-500">{error}</p>
  }

  if (!invoice) {
    return <p className="text-white/50">Invoice not found</p>
  }

  const canIssue = user?.role === "owner" && invoice.status === "draft"
  const canPay =
    user?.role === "client" &&
    invoice.status !== "draft" &&
    Number(invoice.amountDue) > 0
  const companyLabel = tenantName || "Agency Workspace"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-4">
          <Link
            to="/billing"
            className="inline-flex items-center gap-2 shrink-0"
          >
            <ArrowLeft className="h-12 w-12" />
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-5xl font-semibold">{invoice.invoiceNumber}</h1>
              <span
                className={`inline-flex rounded-lg px-3 py-1 text-2xl font-medium ${getInvoiceStatusClasses(invoice.status)}`}
              >
                {formatInvoiceStatus(invoice.status)}
              </span>
            </div>

            <p className="mt-2 text-2xl text-white/60">
              Issued by {companyLabel} on {formatInvoiceDate(invoice.issueDate)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to={`/billing/invoices/${invoice._id}/print`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 px-4 py-2 text-2xl font-medium text-white transition hover:bg-white/10"
          >
            Download PDF
          </Link>

          {canIssue && (
            <button
              onClick={handleIssueInvoice}
              disabled={actionLoading === "issue"}
              className="rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] px-4 py-2 text-2xl font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLoading === "issue" ? "Issuing..." : "Issue Invoice"}
            </button>
          )}

          {canPay && (
            <button
              onClick={handlePayInvoice}
              disabled={actionLoading === "pay"}
              className="rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] px-4 py-2 text-2xl font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLoading === "pay" ? "Opening Razorpay..." : "Pay with Razorpay"}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2">
            <InfoCard title="Company Info">
              <p className="font-medium text-white">{companyLabel}</p>
              <p className="mt-2 text-2xl text-white/55">
                Owner-managed billing workspace
              </p>
              <p className="mt-1 text-2xl text-white/55">
                Reference: {invoice.reference || "Not provided"}
              </p>
            </InfoCard>

            <InfoCard title="Bill To">
              <p className="font-medium text-white">
                {invoice.contactSnapshot?.name || "Client contact"}
              </p>
              <p className="mt-2 text-2xl text-white/60">
                {invoice.contactSnapshot?.email}
              </p>
              {invoice.contactSnapshot?.companyName && (
                <p className="mt-1 text-2xl text-white/60">
                  {invoice.contactSnapshot.companyName}
                </p>
              )}
              {invoice.contactSnapshot?.phone && (
                <p className="mt-1 text-2xl text-white/60">
                  {invoice.contactSnapshot.phone}
                </p>
              )}
              {invoice.contactSnapshot?.address && (
                <p className="mt-1 whitespace-pre-line text-2xl text-white/60">
                  {invoice.contactSnapshot.address}
                </p>
              )}
            </InfoCard>
          </section>

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B]">
            <div className="border-b border-white/10 px-6 py-4">
              <h2 className="text-2xl font-semibold">Line Items</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-2xl">
                <thead className="bg-white/[0.03] text-white/55">
                  <tr>
                    <th className="px-6 py-4 font-medium">Item</th>
                    <th className="px-6 py-4 font-medium">Qty</th>
                    <th className="px-6 py-4 font-medium">Unit Price</th>
                    <th className="px-6 py-4 font-medium">Tax</th>
                    <th className="px-6 py-4 font-medium">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items || []).map((item) => (
                    <tr key={item._id} className="border-t border-white/5 text-white/85">
                      <td className="px-6 py-4 font-medium">{item.itemName}</td>
                      <td className="px-6 py-4">{item.quantity}</td>
                      <td className="px-6 py-4">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-6 py-4">{item.taxRate}%</td>
                      <td className="px-6 py-4">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-6">
            <h2 className="text-2xl font-semibold">Payment Activity</h2>

            {(invoice.payments || []).length === 0 ? (
              <p className="mt-4 text-2xl text-white/45">No payments recorded yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {invoice.payments.map((payment) => (
                  <div
                    key={payment._id}
                    className="rounded-xl border border-white/10 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">
                          {formatCurrency(payment.amount)} via {payment.gateway}
                        </p>
                        <p className="mt-1 text-2xl text-white/45">
                          {payment.transactionId}
                        </p>
                      </div>
                      <p className="text-2xl text-white/45">
                        {payment.paidAt
                          ? new Date(payment.paidAt).toLocaleString()
                          : "Pending"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {invoice.notes && (
            <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-6">
              <h2 className="text-2xl font-semibold">Notes</h2>
              <p className="mt-4 whitespace-pre-line text-2xl text-white/65">
                {invoice.notes}
              </p>
            </section>
          )}
        </div>

        <aside className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-6">
          <h2 className="text-2xl font-semibold">Summary</h2>

          <div className="mt-5 space-y-4">
            <SummaryRow label="Issue Date" value={formatInvoiceDate(invoice.issueDate)} />
            <SummaryRow label="Due Date" value={formatInvoiceDate(invoice.dueDate)} />
            <SummaryRow label="Subtotal" value={formatCurrency(invoice.subtotal)} />
            <SummaryRow label="Tax Total" value={formatCurrency(invoice.taxTotal)} />
            <SummaryRow label="Total" value={formatCurrency(invoice.total)} emphasized />
            <SummaryRow label="Amount Paid" value={formatCurrency(invoice.amountPaid)} />
            <SummaryRow label="Amount Due" value={formatCurrency(invoice.amountDue)} emphasized />
          </div>
        </aside>
      </div>
    </div>
  )
}

export default InvoiceDetails
