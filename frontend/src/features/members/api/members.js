import api from '@/shared/api/axios'

export const fetchMembers = (params) => {
    
    return api.get('/members', { params })
}

export const inviteMember = (data) => {

    return api.post("/user-invite/member", data)
}

export const deleteMember = (id) => {

    return api.delete(`/members/${id}`)
}
