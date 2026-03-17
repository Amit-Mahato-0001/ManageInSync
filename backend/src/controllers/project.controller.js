const { createProject, getProject, deleteProject, assignClient, updateProjectStatus} = require('../services/project.service')

const createProjectHandler = async (req, res, next) => {
    try {
        
        const project = await createProject({
            name: req.body.name,
            description: req.body.description,
            members: req.body.members,
            clients: req.body.clientIds,
            tenantId: req.tenantId
        })

        return res.status(201).json({
            message: "Project created successfully",
            project
        })

    } catch (error) {
        
        next(error)
    }
}

const getProjectHandler = async(req, res, next) => {

    try {
        
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const search = req.query.search || ""
        const status = req.query.status

        const projects = await getProject({
            tenantId: req.tenantId,
            user: req.user,
            page,
            limit,
            search,
            status
        })

        return res.status(200).json({
            projects
        })

    } catch (error) {
        
        next(error)
    }
}

const deleteProjectHandler = async(req, res, next) => {

    try {
        
        const {projectId} = req.params

        const project = await deleteProject(projectId, req.tenantId)

        return res.status(200).json({
            message: "Project deleted successfully",
            project
        })

    } catch (error) {
        
        next(error)
    }
}

const assignClientHandler = async (req, res, next) => {

    try{
        const {projectId} = req.params
        const {clientIds} = req.body

        const project = await assignClient({
            projectId,
            clientIds,
            tenantId: req.tenantId
        })

        return res.status(200).json({
            message: "Client assigned successfully",
            project
        })

    } catch (error){
        
        next(error)
    }
}

const updateProjectStatusHandler = async (req, res, next) => {

    try{
        
        const { projectId } = req.params
        const { status } = req.body

        const updated = await updateProjectStatus({
            projectId,
            tenantId: req.tenantId,
            user: req.user,
            status
        })

        res.json({
            message: "Project status updated",
            project: updated
        })

    } catch(error){

        next(error)
    }
}

module.exports = {
    createProjectHandler,
    getProjectHandler,
    deleteProjectHandler,
    assignClientHandler,
    updateProjectStatusHandler
}