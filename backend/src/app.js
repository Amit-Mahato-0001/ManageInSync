require('dotenv').config()
const express = require('express')
const connectDB = require('./config/db')

const app = express()
connectDB()

app.use(express.json())

app.get('/health', (req, res) => {
    res.json({ status: "Ok hai ji" })
})

module.exports = app