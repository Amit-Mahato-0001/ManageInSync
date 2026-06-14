const mongoose = require("mongoose");
const { timeProfileStep } = require("../utils/requestProfiler");
const {
    ACTIVITY_CATEGORIES,
    ACTIVITY_VISIBILITY,
    buildActorSnapshot,
    buildProjectSnapshot,
    recordActivity
} = require("../services/activity.service");

// Services for other operations (create, delete, assign, etc.)
const {
    createProject,
    deleteProject,
    assignClient,
    updateProjectStatus,
    assignMember
} = require("../services/project.service");

// Models for optimized project listing
const Project = require("../models/project.model");
const UserProjectMeta = require("../models/userProjectMeta.model");

const getActorLabel = (user) => user?.email || "Someone";

const formatLabel = (value = "") =>
    value
        .split("-")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

const getEntityCountLabel = (count, singular) =>
    `${count} ${count === 1 ? singular : `${singular}s`}`;

// ---------- CREATE ----------
const createProjectHandler = async (req, res, next) => {
    try {
        const project = await createProject({
            name: req.body.name,
            description: req.body.description,
            targetDate: req.body.targetDate,
            members: req.body.memberIds,
            clients: req.body.clientIds,
            tenantId: req.tenantId
        });

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
        });

        return res.status(201).json({
            message: "Project created successfully",
            project
        });
    } catch (error) {
        next(error);
    }
};

// ---------- GET / LIST (OPTIMIZED) ----------
const getProjectHandler = async (req, res, next) => {
    try {
        // Extract tenantId (support both patterns)
        const tenantId = req.tenantId || req.tenant?._id;
        if (!tenantId) {
            throw new Error("Tenant ID not found in request");
        }

        const { user } = req;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;   // default 20 as per benchmark
        const search = req.query.search || "";
        const status = req.query.status;

        const skip = (page - 1) * limit;
        const limitNum = limit;

        // 1. Build match conditions
        const match = {
            tenantId: new mongoose.Types.ObjectId(tenantId),
            deletedAt: null
        };

        if (status && ["active", "completed", "on-hold"].includes(status)) {
            match.status = status;
        }
        if (search && search.trim()) {
            match.name = { $regex: search.trim(), $options: "i" };
        }

        // Role-based access
        if (user.role === "member") {
            match.members = user._id;
        } else if (user.role === "client") {
            match.clients = user._id;
        }

        // 2. Single aggregation pipeline
        const pipeline = [
            { $match: match },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limitNum },

            // Lookup conversation (1:1 with project)
            {
                $lookup: {
                    from: "conversations",
                    let: { projectId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$projectId", "$$projectId"] },
                                deletedAt: null
                            }
                        },
                        { $project: { _id: 1, lastMessageAt: 1, createdBy: 1 } }
                    ],
                    as: "conversation"
                }
            },
            { $unwind: { path: "$conversation", preserveNullAndEmptyArrays: true } },

            // Lookup precomputed unread count for this user
            {
                $lookup: {
                    from: "userprojectmetas",
                    let: { projectId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$projectId", "$$projectId"] },
                                userId: user._id
                            }
                        },
                        { $project: { unreadCount: 1, _id: 0 } }
                    ],
                    as: "unreadMeta"
                }
            },
            {
                $addFields: {
                    unreadCount: {
                        $ifNull: [{ $arrayElemAt: ["$unreadMeta.unreadCount", 0] }, 0]
                    }
                }
            },
            { $project: { unreadMeta: 0 } }
        ];

        const projects = await timeProfileStep("projects.aggregation", () =>
            Project.aggregate(pipeline)
        );

        // 3. Total count – fast estimated count (or cache later)
        let total = 0;
        const useEstimatedCount = true; // set false if exact count mandatory
        if (useEstimatedCount) {
            const estimated = await Project.estimatedDocumentCount({
                tenantId: new mongoose.Types.ObjectId(tenantId)
            });
            total = estimated;
        } else {
            const countPipeline = [{ $match: match }, { $count: "total" }];
            const countResult = await Project.aggregate(countPipeline);
            total = countResult[0]?.total || 0;
        }

        const totalPages = Math.ceil(total / limitNum) || 1;

        return res.status(200).json({
            success: true,
            data: projects,
            pagination: {
                page,
                limit: limitNum,
                total,
                pages: totalPages
            }
        });
    } catch (error) {
        next(error);
    }
};

// ---------- DELETE ----------
const deleteProjectHandler = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const project = await deleteProject(projectId, req.tenantId);

        await recordActivity({
            tenantId: req.tenantId,
            type: "project.deleted",
            category: ACTIVITY_CATEGORIES.PROJECT,
            summary: `${getActorLabel(req.user)} deleted project "${project.name}"`,
            actor: buildActorSnapshot(req.user),
            project: buildProjectSnapshot(project),
            visibility: ACTIVITY_VISIBILITY.TEAM,
            memberIds: project.members
        });

        return res.status(200).json({
            message: "Project deleted successfully",
            project
        });
    } catch (error) {
        next(error);
    }
};

// ---------- ASSIGN CLIENT ----------
const assignClientHandler = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { clientIds } = req.body;

        const result = await assignClient({
            projectId,
            clientIds,
            tenantId: req.tenantId
        });

        const project = result.project;
        const previousCount = result.previousClientIds.length;
        const currentCount = project.clients?.length || 0;

        let summary = `${getActorLabel(req.user)} updated clients on "${project.name}"`;
        if (currentCount === 0) {
            summary = `${getActorLabel(req.user)} cleared clients from "${project.name}"`;
        } else if (previousCount === 0) {
            summary = `${getActorLabel(req.user)} assigned ${getEntityCountLabel(currentCount, "client")} to "${project.name}"`;
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
        });

        return res.status(200).json({
            message: "Project clients updated successfully",
            project
        });
    } catch (error) {
        next(error);
    }
};

// ---------- UPDATE STATUS ----------
const updateProjectStatusHandler = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { status } = req.body;

        const result = await updateProjectStatus({
            projectId,
            tenantId: req.tenantId,
            user: req.user,
            status
        });

        const project = result.project;

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
            });
        }

        res.json({
            message: "Project status updated",
            project
        });
    } catch (error) {
        next(error);
    }
};

// ---------- ASSIGN MEMBER ----------
const assignMemberHandler = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { memberIds } = req.body;

        const result = await assignMember({
            projectId,
            memberIds,
            tenantId: req.tenantId
        });

        const project = result.project;
        const previousCount = result.previousMemberIds.length;
        const currentCount = project.members?.length || 0;

        let summary = `${getActorLabel(req.user)} updated members on "${project.name}"`;
        if (currentCount === 0) {
            summary = `${getActorLabel(req.user)} cleared members from "${project.name}"`;
        } else if (previousCount === 0) {
            summary = `${getActorLabel(req.user)} assigned ${getEntityCountLabel(currentCount, "member")} to "${project.name}"`;
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
        });

        return res.status(200).json({
            message: "Project members updated successfully",
            project
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createProjectHandler,
    getProjectHandler,
    deleteProjectHandler,
    assignClientHandler,
    updateProjectStatusHandler,
    assignMemberHandler
};