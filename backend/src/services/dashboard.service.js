//total projects
//active projects
//total users
//total clients

const Project = require('../models/project.model')
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

    //users which belong to given tenant id and are active 
    const activeUserQuery = {
        tenantId,
        status: "active"
    }

    const [
        totalProjects,
        activeProjects,
        totalUsers,
        totalClients

    ] = await Promise.all([

        //total projects
        Project.countDocuments(activeProjectQuery),

        //active projects
        Project.countDocuments({
            ...activeProjectQuery,
            status: "active"
        }),

        //total users 
        User.countDocuments({
            ...activeUserQuery,
            role: { $ne: "client" }
        }),
        
        //total clients
        User.countDocuments({
            ...activeUserQuery,
            role: "client"
        })
    ])

    return{
        totalProjects,
        activeProjects,
        totalUsers,
        totalClients
    }
}

module.exports = dashboard
