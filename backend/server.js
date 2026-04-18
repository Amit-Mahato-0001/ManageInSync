const startServer = async () => {

    try {
        const { loadEnvironment } = require("./src/config/env")

        loadEnvironment()

        const app = require('./src/app')
        const connectDB = require('./src/config/db')
        const PORT = process.env.PORT || 3000

        await connectDB()

        app.listen(PORT, () => {
            console.log("Server is running on port", PORT)
        })

    } catch (error) {

        console.error("Server startup failed:", error.message)
        process.exit(1)
        
    }
}

startServer()
