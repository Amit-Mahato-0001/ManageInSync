const mongoose = require('mongoose')

const connectDB = async (options = {}) => {

    if (!process.env.MONGO_URI) {

        throw new Error("MONGO_URI is not set")

    }

    try {

        await mongoose.connect(process.env.MONGO_URI, options)
        console.log("Database connected successfully")

    } catch (error) {

        console.error("Database connection failed:", error.message)
        throw error

    }
    
}

module.exports = connectDB
