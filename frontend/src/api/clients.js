import api from './axios'

export const fetchClients = () => {

    return api.get('/clients')
}

export const inviteClient = (data) => {

    return api.post('/clients-invite/invite', data)
}

export const deleteClient = (id) => {

    return api.delete(`/clients/${id}`)
}