const { createProject, getProject, deleteProject, assignClient, updateProjectStatus} = require('../services/project.service')

const createProjectHandler = async (req, res) => {
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
        return res.status(400).json({
            message: error.message
        })
    }
}

const getProjectHandler = async(req, res) => {

    try {
        
        const projects = await getProject({
            tenantId: req.tenantId,
            user: req.user
        })

        return res.status(200).json({
            projects
        })

    } catch (error) {
        return res.status(400).json({
            message: error.message
        })
    }
}

const deleteProjectHandler = async(req, res) => {

    try {
        
        const {projectId} = req.params

        const project = await deleteProject(projectId, req.tenantId)

        return res.status(200).json({
            message: "Project deleted successfully",
            project
        })

    } catch (error) {
        
        return res.status(400).json({
            message: error.message
        })
    }
}

const assignClientHandler = async (req, res) => {

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
        return res.status(400).json({
            message: error.message
        })
    }
}

const updateProjectStatusHandler = async (req, res) => {

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

        res.status(400).json({

            message: error.message
        })
    }
}

module.exports = {
    createProjectHandler,
    getProjectHandler,
    deleteProjectHandler,
    assignClientHandler,
    updateProjectStatusHandler
}