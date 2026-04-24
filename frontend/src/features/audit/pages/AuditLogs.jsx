import { useEffect, useState } from "react"
import { Search } from "lucide-react"

import fetchAuditLogs from "../api/audit"
import ProjectsPagination from "@/shared/components/ProjectsPagination"

const formatTimestamp = (value) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return date.toLocaleString()
}

const formatMeta = (meta) => {
  if (!meta || typeof meta !== "object") {
    return ""
  }

  return Object.entries(meta)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" | ")
}

export default function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")

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

  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        setLoading(true)

        const response = await fetchAuditLogs({
          page,
          limit: 10,
          ...(search ? { search } : {})
        })

        setAuditLogs(response.data.auditLogs.data)
        setPagination(response.data.auditLogs.pagination)
        setError("")
      } catch (requestError) {
        console.error(requestError)
        setError("Failed to load audit logs")
      } finally {
        setLoading(false)
      }
    }

    loadAuditLogs()
  }, [page, search])

  if (loading) return <p>Loading audit logs...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-5xl font-semibold">Audit Logs</h1>
        <p className="text-2xl text-white/60">
          Review security-relevant account and admin actions across your workspace.
        </p>
      </div>

      <label className="flex items-center gap-4 rounded-xl border border-white/10 px-4 py-3">
        <Search className="h-6 w-6 text-white/45" />
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by action"
          className="w-full bg-transparent text-2xl text-white outline-none placeholder:text-white/35"
        />
      </label>

      {error && <p className="text-2xl text-red-500">{error}</p>}

      <div className="space-y-3">
        {auditLogs.map((log) => {
          const metaLabel = formatMeta(log.meta)

          return (
            <div
              key={log._id}
              className="rounded-xl border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <p className="text-2xl font-medium text-white">{log.action}</p>
                  <p className="text-2xl text-white/55">
                    {log.actor?.email || "Unknown actor"}
                  </p>
                  {metaLabel && (
                    <p className="text-2xl text-white/40">{metaLabel}</p>
                  )}
                </div>

                <p className="text-2xl text-white/40">
                  {formatTimestamp(log.createdAt)}
                </p>
              </div>
            </div>
          )
        })}

        {!error && auditLogs.length === 0 && (
          <p className="text-2xl text-white/40">
            No audit logs found.
          </p>
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
