import api from "@/shared/api/axios"

const fetchAuditLogs = (params) => {
  return api.get("/audit-logs", { params })
}

export default fetchAuditLogs
