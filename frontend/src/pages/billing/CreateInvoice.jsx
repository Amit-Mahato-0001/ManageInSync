import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { MinusCircle, PlusCircle } from "lucide-react"

import { createInvoice } from "../../api/billing"
import { fetchClients } from "../../api/clients"
import {
  addDaysToInputValue,
  calculateInvoicePreview,
  formatCurrency,
  getBillingErrorMessage,
  getTodayInputValue,
  splitBillingValidationErrors
} from "./billingUtils"

const createEmptyItem = () => ({
  itemName: "",
  quantity: "1",
  unitPrice: "0",
  taxRate: "18"
})

const fieldBaseClassName =
  "w-full rounded-xl border px-4 py-3 text-2xl text-white outline-none transition bg-transparent placeholder:text-white/30"

const getFieldClassName = (hasError) =>
  `${fieldBaseClassName} ${
    hasError
      ? "border-red-400/80 hover:border-red-400 focus:border-red-400"
      : "border-white/10 hover:border-blue-500 focus:border-blue-500"
  }`

const TextField = ({
  label,
  value,
  onChange,
  error,
  className = "",
  ...props
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-2xl font-medium uppercase tracking-[0.2em] text-white/45">
        {label}
      </label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={getFieldClassName(Boolean(error))}
        {...props}
      />
      {error && <p className="text-2xl text-red-500">{error}</p>}
    </div>
  )
}

const TextAreaField = ({
  label,
  value,
  onChange,
  error,
  className = "",
  ...props
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-2xl font-medium uppercase tracking-[0.2em] text-white/45">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${getFieldClassName(Boolean(error))} min-h-28 resize-y`}
        {...props}
      />
      {error && <p className="text-2xl text-red-500">{error}</p>}
    </div>
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

const CreateInvoice = () => {
  const navigate = useNavigate()
  const today = getTodayInputValue()
  const [clients, setClients] = useState([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [pageError, setPageError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({})
  const [form, setForm] = useState({
    clientUserId: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    companyName: "",
    address: "",
    issueDate: today,
    dueDate: addDaysToInputValue(today, 7),
    reference: "",
    notes: "",
    status: "draft",
    items: [createEmptyItem()]
  })

  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoadingClients(true)
        const response = await fetchClients()
        setClients(response.data.clients || [])
        setPageError("")
      } catch (requestError) {
        console.error(requestError)
        setPageError(getBillingErrorMessage(requestError, "Failed to load clients"))
      } finally {
        setLoadingClients(false)
      }
    }

    loadClients()
  }, [])

  const invoicePreview = useMemo(
    () => calculateInvoicePreview(form.items),
    [form.items]
  )

  const setFieldValue = (field, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }))

    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: ""
    }))
    setPageError("")
  }

  const handleClientChange = (event) => {
    const nextClientId = event.target.value
    const selectedClient = clients.find((client) => client._id === nextClientId)

    setForm((currentForm) => ({
      ...currentForm,
      clientUserId: nextClientId,
      contactEmail: selectedClient?.email || currentForm.contactEmail
    }))

    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      clientUserId: "",
      contactEmail: ""
    }))
    setPageError("")
  }

  const handleItemChange = (index, field, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      items: currentForm.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value
            }
          : item
      )
    }))

    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      items: ""
    }))
  }

  const addItem = () => {
    setForm((currentForm) => ({
      ...currentForm,
      items: [...currentForm.items, createEmptyItem()]
    }))
  }

  const removeItem = (index) => {
    if (form.items.length === 1) {
      return
    }

    setForm((currentForm) => ({
      ...currentForm,
      items: currentForm.items.filter((_, itemIndex) => itemIndex !== index)
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const payload = {
      clientUserId: form.clientUserId,
      contactName: form.contactName.trim(),
      contactEmail: form.contactEmail.trim(),
      contactPhone: form.contactPhone.trim() || undefined,
      companyName: form.companyName.trim() || undefined,
      address: form.address.trim() || undefined,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      reference: form.reference.trim() || undefined,
      notes: form.notes.trim() || undefined,
      status: form.status,
      items: form.items.map((item) => ({
        itemName: item.itemName.trim(),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        taxRate: Number(item.taxRate)
      }))
    }

    const toastId = toast.loading("Creating invoice...")

    try {
      setSubmitting(true)
      setPageError("")
      setFieldErrors({})

      const response = await createInvoice(payload)

      toast.success("Invoice created", { id: toastId })
      navigate(`/billing/${response.data.invoice._id}`)
    } catch (requestError) {
      console.error(requestError)

      const { fieldErrors: nextFieldErrors, formError } =
        splitBillingValidationErrors(requestError)

      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors)
        setPageError(formError || "Please review the highlighted fields")
        toast.dismiss(toastId)
      } else {
        const message = getBillingErrorMessage(
          requestError,
          "Failed to create invoice"
        )

        setPageError(message)
        toast.error(message, { id: toastId })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-5xl font-semibold">Create Invoice</h1>
          <p className="text-2xl text-white/60">
            Assign an invoice to a client and keep payment access limited to that client.
          </p>
        </div>

        <Link
          to="/billing"
          className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-2xl font-medium text-white transition hover:bg-white/10"
        >
          Back to Billing
        </Link>
      </div>

      {pageError && <p className="text-2xl text-red-500">{pageError}</p>}

      {loadingClients ? (
        <p>Loading clients...</p>
      ) : clients.length === 0 ? (
        <div className="rounded-2xl border border-white/10 p-6">
          <p className="text-2xl text-white/70">
            Invite at least one client before creating invoices.
          </p>
          <Link
            to="/clients"
            className="mt-4 inline-flex rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-2xl font-medium text-white transition hover:bg-white/10"
          >
            Go to Clients
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
        >
          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-6">
              <h2 className="text-2xl font-semibold">Billing Contact</h2>
              <p className="mt-1 text-2xl text-white/55">
                The selected client will be the only client account allowed to pay this invoice.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-2xl font-medium uppercase tracking-[0.2em] text-white/45">
                    Client
                  </label>
                  <select
                    value={form.clientUserId}
                    onChange={handleClientChange}
                    className={getFieldClassName(Boolean(fieldErrors.clientUserId))}
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.email}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.clientUserId && (
                    <p className="text-2xl text-red-500">{fieldErrors.clientUserId}</p>
                  )}
                </div>

                <TextField
                  label="Contact Name"
                  value={form.contactName}
                  onChange={(value) => setFieldValue("contactName", value)}
                  error={fieldErrors.contactName}
                  placeholder="Acme Finance Team"
                />

                <TextField
                  label="Contact Email"
                  value={form.contactEmail}
                  onChange={(value) => setFieldValue("contactEmail", value)}
                  error={fieldErrors.contactEmail}
                  placeholder="billing@client.com"
                />

                <TextField
                  label="Phone"
                  value={form.contactPhone}
                  onChange={(value) => setFieldValue("contactPhone", value)}
                  error={fieldErrors.contactPhone}
                  placeholder="+91 98765 43210"
                />

                <TextField
                  label="Company"
                  value={form.companyName}
                  onChange={(value) => setFieldValue("companyName", value)}
                  error={fieldErrors.companyName}
                  placeholder="Acme Labs"
                />

                <TextAreaField
                  label="Address"
                  value={form.address}
                  onChange={(value) => setFieldValue("address", value)}
                  error={fieldErrors.address}
                  placeholder="Full billing address"
                  className="md:col-span-2"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-6">
              <h2 className="text-2xl font-semibold">Invoice Details</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <TextField
                  type="date"
                  label="Issue Date"
                  value={form.issueDate}
                  onChange={(value) => setFieldValue("issueDate", value)}
                  error={fieldErrors.issueDate}
                />

                <TextField
                  type="date"
                  label="Due Date"
                  value={form.dueDate}
                  onChange={(value) => setFieldValue("dueDate", value)}
                  error={fieldErrors.dueDate}
                />

                <TextField
                  label="Reference"
                  value={form.reference}
                  onChange={(value) => setFieldValue("reference", value)}
                  error={fieldErrors.reference}
                  placeholder="Website retainer - April"
                />

                <div className="space-y-2">
                  <label className="text-2xl font-medium uppercase tracking-[0.2em] text-white/45">
                    Initial Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(event) => setFieldValue("status", event.target.value)}
                    className={getFieldClassName(Boolean(fieldErrors.status))}
                  >
                    <option value="draft">Draft</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                  {fieldErrors.status && (
                    <p className="text-2xl text-red-500">{fieldErrors.status}</p>
                  )}
                </div>

                <TextAreaField
                  label="Notes"
                  value={form.notes}
                  onChange={(value) => setFieldValue("notes", value)}
                  error={fieldErrors.notes}
                  placeholder="Optional billing notes"
                  className="md:col-span-2"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Line Items</h2>
                  <p className="mt-1 text-2xl text-white/55">
                    Totals are previewed here, but the server recalculates everything on save.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-2xl"
                >
                  Add Item
                </button>
              </div>

              {fieldErrors.items && (
                <p className="mt-4 text-2xl text-red-500">{fieldErrors.items}</p>
              )}

              <div className="mt-5 space-y-4">
                {form.items.map((item, index) => (
                  <div
                    key={`${index}-${item.itemName}`}
                    className="rounded-2xl border border-white/10 bg-[#18181B] p-4"
                  >
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1.8fr)_110px_140px_110px_auto]">
                      <TextField
                        label={`Item ${index + 1}`}
                        value={item.itemName}
                        onChange={(value) => handleItemChange(index, "itemName", value)}
                        placeholder="Monthly design retainer"
                      />

                      <TextField
                        type="number"
                        label="Qty"
                        value={item.quantity}
                        onChange={(value) => handleItemChange(index, "quantity", value)}
                        min="0"
                        step="1"
                      />

                      <TextField
                        type="number"
                        label="Price"
                        value={item.unitPrice}
                        onChange={(value) => handleItemChange(index, "unitPrice", value)}
                        min="0"
                        step="0.01"
                      />

                      <TextField
                        type="number"
                        label="Tax %"
                        value={item.taxRate}
                        onChange={(value) => handleItemChange(index, "taxRate", value)}
                        min="0"
                        step="0.01"
                      />

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={form.items.length === 1}
                          className="inline-flex h-[50px] w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-6">
              <h2 className="text-2xl font-semibold">Invoice Summary</h2>

              <div className="mt-5 space-y-4">
                <SummaryRow label="Subtotal" value={formatCurrency(invoicePreview.subtotal)} />
                <SummaryRow label="Tax Total" value={formatCurrency(invoicePreview.taxTotal)} />
                <SummaryRow
                  label="Amount Due"
                  value={formatCurrency(invoicePreview.total)}
                  emphasized
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full rounded-xl border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 px-4 py-3 text-2xl font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Creating..." : "Create Invoice"}
              </button>
            </section>
          </aside>
        </form>
      )}
    </div>
  )
}

export default CreateInvoice
