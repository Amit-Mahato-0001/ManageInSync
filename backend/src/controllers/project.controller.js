const { createProject, getProject, deleteProject, assignClient} = require('../services/project.service')

const createProjectHandler = async (req, res) => {
    try {
        
        const project = await createProject({
            name: req.body.name,
            description: req.body.description,
            members: req.body.members,
            clientId: req.body.clientId,
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
        
        const projects = await getProject(req.tenantId)

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
        const {clientId} = req.body

        const project = await assignClient({
            projectId,
            clientId,
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

module.exports = {
    createProjectHandler,
    getProjectHandler,
    deleteProjectHandler,
    assignClientHandler
}