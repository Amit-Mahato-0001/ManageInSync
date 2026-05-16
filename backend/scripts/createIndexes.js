const mongoose = require("mongoose")

const { loadEnvironment } = require("../src/config/env")
const connectDB = require("../src/config/db")

const models = [
    require("../src/models/activity.model"),
    require("../src/models/audit.model"),
    require("../src/models/contact.model"),
    require("../src/models/conversation.model"),
    require("../src/models/invoice.model"),
    require("../src/models/invoiceItem.model"),
    require("../src/models/message.model"),
    require("../src/models/payment.model"),
    require("../src/models/project.model"),
    require("../src/models/session.model"),
    require("../src/models/task.model"),
    require("../src/models/tenant.model"),
    require("../src/models/user.model")
]

const createIndexes = async () => {
    loadEnvironment()
    await connectDB()

    const results = []

    for (const model of models) {
        const result = await ensureModelIndexes(model)

        results.push(result)
    }

    return results
}

const ensureModelIndexes = async (model) => {
    const repairedIndexes = []

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            const indexes = await model.createIndexes()

            return {
                modelName: model.modelName,
                indexes,
                indexCount: model.schema.indexes().length,
                repairedIndexes
            }
        } catch (error) {
            const indexName = getConflictingIndexName(error)

            if (!indexName || repairedIndexes.includes(indexName)) {
                throw error
            }

            await model.collection.dropIndex(indexName)
            repairedIndexes.push(indexName)
        }
    }

    throw new Error(`Could not create indexes for ${model.modelName}`)
}

const getConflictingIndexName = (error) => {
    if (!/equivalent index already exists/i.test(error?.message || "")) {
        return null
    }

    return error.message.match(/name:\s*"([^"]+)"/)?.[1] || null
}

const run = async () => {
    try {
        const results = await createIndexes()

        console.log("Database indexes created successfully")

        results.forEach(({ modelName, indexCount, repairedIndexes }) => {
            console.log(`${modelName}: ${indexCount} index(es) ensured`)

            repairedIndexes.forEach((indexName) => {
                console.log(`${modelName}: repaired conflicting index ${indexName}`)
            })
        })
    } catch (error) {
        console.error("Database index creation failed:", error.message)
        process.exitCode = 1
    } finally {
        await mongoose.connection.close()
    }
}

run()
