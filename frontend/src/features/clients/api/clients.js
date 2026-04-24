import api from '@/shared/api/axios'

export const fetchClients = (params) => {

    return api.get('/clients', { params })
}

export const inviteClient = (data) => {

    return api.post('/user-invite/client', data)
}

export const deleteClient = (id) => {

    return api.delete(`/clients/${id}`)
}
