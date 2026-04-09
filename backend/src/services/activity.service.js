const mongoose = require("mongoose")
const Activity = require("../models/activity.model")

const ACTIVITY_CATEGORIES = Object.freeze({
    PROJECT: "project",
    TASK: "task",
    TEAM: "team",
    CLIENT: "client"
})

const ACTIVITY_VISIBILITY = Object.freeze({
    TEAM: ["owner", "admin", "member"],
    ADMIN: ["owner", "admin"]
})

const getObjectId = (value) => {
    const resolved = value?._id || value

    if (!resolved || !mongoose.Types.ObjectId.isValid(resolved)) {
        return null
    }

    return new mongoose.Types.ObjectId(resolved)
}

const normalizeObjectIds = (values = []) => {
    if (!Array.isArray(values)) {
        return []
    }

    const seen = new Set()

    return values.reduce((result, value) => {
        const objectId = getObjectId(value)

        if (!objectId) {
            return result
        }

        const key = objectId.toString()

        if (seen.has(key)) {
            return result
        }

        seen.add(key)
        result.push(objectId)
        return result
    }, [])
}

const normalizeVisibility = (values = []) => {
    const validRoles = new Set(["owner", "admin", "member", "client"])

    if (!Array.isArray(values)) {
        return []
    }

    return Array.from(new Set(values.filter((value) => validRoles.has(value))))
}

const buildActorSnapshot = (user) => ({
    id: getObjectId(user),
    email: user?.email,
    role: user?.role
})

const buildProjectSnapshot = (project) => {
    if (!project) {
        return undefined
    }

    return {
        id: getObjectId(project),
        name: project?.name
    }
}

const buildTaskSnapshot = (task) => {
    if (!task) {
        return undefined
    }

    return {
        id: getObjectId(task),
        title: task?.title
    }
}

const buildTargetUserSnapshot = (user) => {
    if (!user) {
        return undefined
    }

    return {
        id: getObjectId(user),
        email: user?.email,
        role: user?.role
    }
}

const createActivity = async ({
    tenantId,
    type,
    category,
    summary,
    actor,
    project,
    task,
    targetUser,
    visibility,
    memberIds,
    meta
}) => {
    const resolvedTenantId = getObjectId(tenantId)

    if (!resolvedTenantId) {
        throw new Error("Invalid tenantId for activity")
    }

    if (!type || !summary || !category) {
        throw new Error("Activity type, category and summary are required")
    }

    return Activity.create({
        tenantId: resolvedTenantId,
        type,
        category,
        summary,
        actor,
        project,
        task,
        targetUser,
        visibility: normalizeVisibility(visibility),
        memberIds: normalizeObjectIds(memberIds),
        meta
    })
}

const recordActivity = async (payload) => {
    try {
        await createActivity(payload)
    } catch (error) {
        console.error("Failed to record activity", error)
    }
}

const listActivityFeed = async ({ tenantId, user, page, limit, category }) => {
    const resolvedTenantId = getObjectId(tenantId)

    if (!resolvedTenantId) {
        throw new Error("Invalid tenantId")
    }

    if (!user?.role) {
        throw new Error("User is required to fetch activity feed")
    }

    const safePage = Math.max(1, Number(page) || 1)
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10))
    const skip = (safePage - 1) * safeLimit

    const query = {
        tenantId: resolvedTenantId,
        visibility: user.role
    }

    if (category && category !== "all") {
        query.category = category
    }

    if (user.role === "member") {
        const userId = getObjectId(user)

        query.$or = [
            { memberIds: userId },
            { "actor.id": userId },
            { "targetUser.id": userId }
        ]
    }

    const [data, total] = await Promise.all([
        Activity.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit)
            .lean(),
        Activity.countDocuments(query)
    ])

    return {
        data,
        pagination: {
            total,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.max(1, Math.ceil(total / safeLimit))
        }
    }
}

module.exports = {
    ACTIVITY_CATEGORIES,
    ACTIVITY_VISIBILITY,
    buildActorSnapshot,
    buildProjectSnapshot,
    buildTaskSnapshot,
    buildTargetUserSnapshot,
    createActivity,
    recordActivity,
    listActivityFeed
}
