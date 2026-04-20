import api from '@/shared/api/axios'

export const fetchClients = () => {

    return api.get('/clients')
}

export const inviteClient = (data) => {

    return api.post('/user-invite/client', data)
}

export const deleteClient = (id) => {

    return api.delete(`/clients/${id}`)
}
