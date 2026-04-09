const { createProject, getProject, deleteProject, assignClient, updateProjectStatus, assignMember} = require('../services/project.service')
const {
    ACTIVITY_CATEGORIES,
    ACTIVITY_VISIBILITY,
    buildActorSnapshot,
    buildProjectSnapshot,
    recordActivity
} = require("../services/activity.service")

const getActorLabel = (user) => user?.email || "Someone"
const formatLabel = (value = "") =>
    value
        .split("-")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")

const getEntityCountLabel = (count, singular) =>
    `${count} ${count === 1 ? singular : `${singular}s`}`

const createProjectHandler = async (req, res, next) => {
    try {
        
        const project = await createProject({
            name: req.body.name,
            description: req.body.description,
            targetDate: req.body.targetDate,
            members: req.body.memberIds,
            clients: req.body.clientIds,
            tenantId: req.tenantId
        })

        await recordActivity({
            tenantId: req.tenantId,
            type: "project.created",
            category: ACTIVITY_CATEGORIES.PROJECT,
            summary: `${getActorLabel(req.user)} created project "${project.name}"`,
            actor: buildActorSnapshot(req.user),
            project: buildProjectSnapshot(project),
            visibility: ACTIVITY_VISIBILITY.TEAM,
            memberIds: project.members,
            meta: {
                status: project.status,
                targetDate: project.targetDate || null
            }
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

        await recordActivity({
            tenantId: req.tenantId,
            type: "project.deleted",
            category: ACTIVITY_CATEGORIES.PROJECT,
            summary: `${getActorLabel(req.user)} deleted project "${project.name}"`,
            actor: buildActorSnapshot(req.user),
            project: buildProjectSnapshot(project),
            visibility: ACTIVITY_VISIBILITY.TEAM,
            memberIds: project.members
        })

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

        const result = await assignClient({
            projectId,
            clientIds,
            tenantId: req.tenantId
        })

        const project = result.project
        const previousCount = result.previousClientIds.length
        const currentCount = project.clients?.length || 0

        let summary = `${getActorLabel(req.user)} updated clients on "${project.name}"`

        if (currentCount === 0) {
            summary = `${getActorLabel(req.user)} cleared clients from "${project.name}"`
        } else if (previousCount === 0) {
            summary = `${getActorLabel(req.user)} assigned ${getEntityCountLabel(currentCount, "client")} to "${project.name}"`
        }

        await recordActivity({
            tenantId: req.tenantId,
            type: "project.clients_assigned",
            category: ACTIVITY_CATEGORIES.PROJECT,
            summary,
            actor: buildActorSnapshot(req.user),
            project: buildProjectSnapshot(project),
            visibility: ACTIVITY_VISIBILITY.TEAM,
            memberIds: project.members,
            meta: {
                previousCount,
                currentCount
            }
        })

        return res.status(200).json({
            message: "Project clients updated successfully",
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

        const result = await updateProjectStatus({
            projectId,
            tenantId: req.tenantId,
            user: req.user,
            status
        })

        const project = result.project

        if (result.previousStatus !== project.status) {
            await recordActivity({
                tenantId: req.tenantId,
                type: "project.status_changed",
                category: ACTIVITY_CATEGORIES.PROJECT,
                summary: `${getActorLabel(req.user)} changed "${project.name}" from ${formatLabel(result.previousStatus)} to ${formatLabel(project.status)}`,
                actor: buildActorSnapshot(req.user),
                project: buildProjectSnapshot(project),
                visibility: ACTIVITY_VISIBILITY.TEAM,
                memberIds: project.members,
                meta: {
                    from: result.previousStatus,
                    to: project.status
                }
            })
        }

        res.json({
            message: "Project status updated",
            project
        })

    } catch(error){

        next(error)
    }
}

const assignMemberHandler = async (req, res, next) => {

    try{

        const {projectId} = req.params
        const {memberIds} = req.body

        const result = await assignMember({

            projectId,
            memberIds,
            tenantId: req.tenantId

        })

        const project = result.project
        const previousCount = result.previousMemberIds.length
        const currentCount = project.members?.length || 0

        let summary = `${getActorLabel(req.user)} updated members on "${project.name}"`

        if (currentCount === 0) {
            summary = `${getActorLabel(req.user)} cleared members from "${project.name}"`
        } else if (previousCount === 0) {
            summary = `${getActorLabel(req.user)} assigned ${getEntityCountLabel(currentCount, "member")} to "${project.name}"`
        }

        await recordActivity({
            tenantId: req.tenantId,
            type: "project.members_assigned",
            category: ACTIVITY_CATEGORIES.PROJECT,
            summary,
            actor: buildActorSnapshot(req.user),
            project: buildProjectSnapshot(project),
            visibility: ACTIVITY_VISIBILITY.TEAM,
            memberIds: project.members,
            meta: {
                previousCount,
                currentCount
            }
        })

        return res.status(200).json({

            message: "Project members updated successfully",
            project

        })

    } catch(error) {

        next(error)

    }
}

module.exports = {
    createProjectHandler,
    getProjectHandler,
    deleteProjectHandler,
    assignClientHandler,
    updateProjectStatusHandler,
    assignMemberHandler
}
