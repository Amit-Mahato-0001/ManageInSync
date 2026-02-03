import api from './axios'

export const fetchProjects = () => {

    return api.get('/projects')

}

export const createProject = (data) => {

    return api.post('/projects', data)

}

export const deleteProject = (projectId) => {


    return api.delete(`/projects/${projectId}`)
}

export const assignClient = (projectId, clientId) => {

    return api.put(`/projects/${projectId}/assign-client`, {clientId})
}