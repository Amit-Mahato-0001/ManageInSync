//total projects
//completed projects
//total tasks
//completed tasks
//total members
//total clients

const Project = require('../models/project.model')
const Task = require('../models/task.model')
const User = require('../models/user.model')

const dashboard = async (tenantId) => {

    if(!tenantId){
        throw new Error("tenantId required")
    }

    //projects which belong to given tenant id and are not deleted 
    const activeProjectQuery = {
        tenantId,
        deletedAt: null
    }

    //members which belong to given tenant id and are active
    const activeMemberQuery = {
        tenantId,
        role: "member",
        status: "active"
    }

    //clients which belong to given tenant id and are active
    const activeClientQuery = {
        tenantId,
        role: "client",
        status: "active"
    }

    const [
        totalProjects,
        completedProjects,
        activeProjectIds,
        totalMembers,
        totalClients

    ] = await Promise.all([

        //total projects
        Project.countDocuments(activeProjectQuery),

        //completed projects
        Project.countDocuments({
            ...activeProjectQuery,
            status: "completed"
        }),

        //current project ids used to scope dashboard task stats
        Project.distinct("_id", activeProjectQuery),

        //total members
        User.countDocuments({
            ...activeMemberQuery
        }),
        
        //total clients
        User.countDocuments({
            ...activeClientQuery
        })
    ])

    const activeProjectTaskQuery = {
        tenantId,
        deletedAt: null,
        projectId: { $in: activeProjectIds }
    }

    const [
        totalTasks,
        completedTasks
    ] = await Promise.all([

        //total tasks that belong to current projects
        Task.countDocuments(activeProjectTaskQuery),

        //completed tasks that belong to current projects
        Task.countDocuments({
            ...activeProjectTaskQuery,
            status: "done"
        })
    ])

    return{
        totalProjects,
        completedProjects,
        totalTasks,
        completedTasks,
        totalMembers,
        totalClients
    }
}

module.exports = dashboard
