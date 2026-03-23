import api from './axios'

export const fetchProjects = (params) => {

    return api.get('/projects', {params})

}

export const createProject = (data) => {

    return api.post('/projects', data)

}

export const deleteProject = (projectId) => {


    return api.delete(`/projects/${projectId}`)
}

export const assignClient = (projectId, clientIds) => {

    return api.put(`/projects/${projectId}/assign-client`, {clientIds})
}

export const updateProjectStatus = (projectId, status) => {

    return api.patch(`/projects/${projectId}/status`, {status})
}

export const assignMember = (projectId, memberIds) => {

    return api.put(`/projects/${projectId}/assign-member`, {memberIds})
}