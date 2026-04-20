import api from '@/shared/api/axios'

const fetchDashboard = () => {
    return api.get('/dashboard')
}

export default fetchDashboard
