import api from './axios'

export const fetchClients = () => {

    return api.get('/clients')
}