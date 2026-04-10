import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Plus, RotateCcw, Search } from "lucide-react"

import { fetchInvoices } from "../../api/billing"
import ProjectsPagination from "../../components/ProjectsPagination"
import { useAuth } from "../../context/AuthContext"
import {
  formatCurrency,
  formatInvoiceDate,
  formatInvoiceStatus,
  getBillingErrorMessage,
  getInvoiceStatusClasses
} from "./billingUtils"

const Billing = () => {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextSearch = searchInput.trim()

      setSearch((currentSearch) => {
        if (currentSearch !== nextSearch) {
          setPage(1)
        }

        return nextSearch
      })
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [searchInput])

  const loadInvoices = useCallback(async ({ showLoader = true } = {}) => {
    try {
      if (showLoader) {
        setLoading(true)
      }

      const response = await fetchInvoices({
        page,
        limit: 10,
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {})
      })

      setInvoices(response.data.invoices.data)
      setPagination(response.data.invoices.pagination)
      setError("")
    } catch (requestError) {
      console.error(requestError)
      setError(getBillingErrorMessage(requestError, "Failed to load invoices"))
    } finally {
      if (showLoader) {
        setLoading(false)
      }
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value)
    setPage(1)
  }

  const handleReset = () => {
    setSearchInput("")
    setSearch("")
    setStatusFilter("")
    setPage(1)
  }

  const isOwner = user?.role === "owner"

  if (loading) {
    return <p className="text-2xl">Loading invoices...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-5xl font-semibold">Billing</h1>
          <p className="text-2xl text-white/60">
            {isOwner
              ? "Create, issue, and track invoices for your clients."
              : "Review invoices assigned to you and complete payments."}
          </p>
        </div>

        {isOwner && (
          <Link
            to="/billing/new"
            className="inline-flex items-center gap-4 rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 px-4 py-2 text-2xl"
          >
            <Plus className="h-6 w-6" />
            Create Invoice
          </Link>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
        <label className="flex items-center gap-4 rounded-xl border border-white/10 px-4 py-3">
          <Search className="h-6 w-6 text-white/45" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search invoice, contact, or company"
            className="w-full bg-transparent text-2xl text-white outline-none placeholder:text-white/35"
          />
        </label>

        <select
          value={statusFilter}
          onChange={handleStatusChange}
          className="rounded-xl border border-white/10 px-4 py-3 text-2xl text-white outline-none"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>

        <button
          onClick={handleReset}
          disabled={!searchInput && !statusFilter}
          className="inline-flex items-center justify-center gap-4 rounded-xl border border-white/10 px-4 py-3 text-2xl text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw className="h-6 w-6" />
          Reset
        </button>
      </div>

      {error && <p className="text-2xl text-red-500">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="">
          <table className="min-w-full text-left text-2xl">
            <thead className="bg-white/[0.03] text-white/55">
              <tr>
                <th className="px-5 py-4 font-medium">Invoice #</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Due Date</th>
                <th className="px-5 py-4 font-medium">Contact</th>
                <th className="px-5 py-4 font-medium">Total</th>
                <th className="px-5 py-4 font-medium">Amount Due</th>
                <th className="px-5 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const contactLabel =
                  invoice.contactSnapshot?.companyName ||
                  invoice.contactSnapshot?.name ||
                  invoice.client?.email ||
                  "Unknown"

                return (
                  <tr
                    key={invoice._id}
                    className="border-t border-white/5 text-white/85"
                  >
                    <td className="px-5 py-4 font-medium">{invoice.invoiceNumber}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-lg px-3 py-1 text-2xl font-medium ${getInvoiceStatusClasses(invoice.status)}`}
                      >
                        {formatInvoiceStatus(invoice.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-white/60">
                      {formatInvoiceDate(invoice.dueDate)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="min-w-[180px]">
                        <p className="font-medium text-white">{contactLabel}</p>
                        <p className="text-2xl text-white/45">
                          {invoice.contactSnapshot?.email || invoice.client?.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">{formatCurrency(invoice.total)}</td>
                    <td className="px-5 py-4">{formatCurrency(invoice.amountDue)}</td>
                    <td className="px-5 py-4">
                      <Link
                        to={`/billing/${invoice._id}`}
                        className="inline-flex rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-2xl"
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {!error && invoices.length === 0 && (
          <div className="px-5 py-12 text-center text-2xl text-white/40">
            No invoices found for the current filters.
          </div>
        )}
      </div>

      <ProjectsPagination
        page={page}
        totalPages={pagination.totalPages || 1}
        onPageChange={setPage}
      />
    </div>
  )
}

export default Billing
