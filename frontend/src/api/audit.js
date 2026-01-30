import api from './axios'

const fetchAuditLogs = () => {

    return api.get('/audit-logs')
}

export default fetchAuditLogs