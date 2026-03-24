import { useEffect, useState } from 'react'
import fetchAuditLogs from '../api/audit'

const AuditLogs = () => {

  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    try {
      const res = await fetchAuditLogs()
      setLogs(res.data)
    } catch (error) {
      console.error("Failed to fetch audit logs")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p>Loading audit logs...</p>

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <p className="text-sm text-white/60">
          Track all system activities
        </p>
      </div>

      {/* LOG LIST */}
      <div className="max-h-[60vh] overflow-y-auto no-scrollbar space-y-3">

        {logs.map((log) => (

          <div
            key={log._id}
            className="rounded-xl p-5 border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] space-y-1"
          >

            {/* ACTION */}
            <p className="text-sm font-medium">
              {log.action}
            </p>

            {/* TIME */}
            <p className="text-xs text-white/40">
              {new Date(log.createdAt).toLocaleString()}
            </p>

          </div>

        ))}

        {logs.length === 0 && (
          <p className="text-sm text-white/40">
            No logs found
          </p>
        )}

      </div>

    </div>
  )
}

export default AuditLogs