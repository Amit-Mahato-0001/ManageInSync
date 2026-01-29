import api from './axios'

const fetchClients = () => {

    return api.get('/clients')
}

export default fetchClients