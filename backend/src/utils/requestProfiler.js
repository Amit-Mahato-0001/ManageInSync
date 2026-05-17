const { AsyncLocalStorage } = require("async_hooks")

const mongoose = require("mongoose")

const profilerStorage = new AsyncLocalStorage()
let mongooseProfilerInstalled = false

const isProjectListProfilingEnabled = () =>
    process.env.PROJECT_LIST_PROFILE === "true"

const shouldProfileRequest = (req) =>
    isProjectListProfilingEnabled() &&
    req.method === "GET" &&
    req.path === "/api/projects"

const getElapsedMs = (startedAt) =>
    Number(process.hrtime.bigint() - startedAt) / 1000000

const createProfileContext = (req) => ({
    requestId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    startedAt: process.hrtime.bigint(),
    method: req.method,
    path: req.originalUrl,
    steps: [],
    mongoQueryCount: 0,
    mongoQueries: []
})

const getProfilerContext = () => profilerStorage.getStore()

const recordProfileStep = (name, durationMs, meta = {}) => {
    const context = getProfilerContext()

    if (!context) {
        return
    }

    context.steps.push({
        name,
        durationMs: Number(durationMs.toFixed(2)),
        ...meta
    })
}

const timeProfileStep = async (name, action, meta = {}) => {
    const startedAt = process.hrtime.bigint()

    try {
        return await action()
    } finally {
        recordProfileStep(name, getElapsedMs(startedAt), meta)
    }
}

const installMongooseProfiler = () => {
    if (mongooseProfilerInstalled || !isProjectListProfilingEnabled()) {
        return
    }

    mongooseProfilerInstalled = true

    mongoose.set("debug", (collectionName, methodName) => {
        const context = getProfilerContext()

        if (!context) {
            return
        }

        context.mongoQueryCount += 1

        if (context.mongoQueries.length < 50) {
            context.mongoQueries.push(`${collectionName}.${methodName}`)
        }
    })
}

const projectListProfiler = () => (req, res, next) => {
    if (!shouldProfileRequest(req)) {
        next()
        return
    }

    const context = createProfileContext(req)

    profilerStorage.run(context, () => {
        res.on("finish", () => {
            const totalMs = Number(getElapsedMs(context.startedAt).toFixed(2))

            console.info("[project-list-profile]", {
                requestId: context.requestId,
                method: context.method,
                path: context.path,
                statusCode: res.statusCode,
                totalMs,
                mongoQueryCount: context.mongoQueryCount,
                mongoQueries: context.mongoQueries,
                steps: context.steps
            })
        })

        next()
    })
}

module.exports = {
    installMongooseProfiler,
    projectListProfiler,
    recordProfileStep,
    timeProfileStep
}
