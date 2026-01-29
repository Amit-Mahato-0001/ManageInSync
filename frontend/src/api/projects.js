import api from './axios'

export const fetchProjects = () => {

    return api.get('/projects')

}

export const createProject = (data) => {

    return api.post('/projects', data)

}
