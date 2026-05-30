const fs = require("fs")
const path = require("path")
const mongoose = require("mongoose")

const { loadEnvironment } = require("../src/config/env")
const connectDB = require("../src/config/db")

const modelsDirectory = path.resolve(__dirname, "../src/models")
const connectTimeoutMs = Number(process.env.DB_INDEX_CONNECT_TIMEOUT_MS) || 10000

const loadModels = () => {
    const modelFiles = fs
        .readdirSync(modelsDirectory)
        .filter((fileName) => fileName.endsWith(".model.js"))
        .sort()

    modelFiles.forEach((fileName) => {
        require(path.join(modelsDirectory, fileName))
    })

    return modelFiles
}

const createDeclaredIndexes = async () => {
    loadEnvironment()

    const loadedModelFiles = loadModels()

    if (loadedModelFiles.length === 0) {
        throw new Error(`No model files found in ${modelsDirectory}`)
    }

    await connectDB({
        serverSelectionTimeoutMS: connectTimeoutMs
    })

    const models = Object.values(mongoose.models)

    for (const model of models) {
        const indexes = model.schema.indexes()

        if (indexes.length === 0) {
            console.log(`No declared indexes for ${model.modelName}`)
            continue
        }

        await model.createIndexes()
        console.log(`Created indexes for ${model.modelName} (${indexes.length})`)
    }
}

createDeclaredIndexes()
    .then(async () => {
        await mongoose.disconnect()
        console.log("Database indexes are ready")
        process.exit(0)
    })
    .catch(async (error) => {
        await mongoose.disconnect().catch(() => null)
        console.error("Failed to create database indexes:", error.message)
        process.exit(1)
    })
