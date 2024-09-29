const express = require('express')
const app = express()
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const cors = require('cors')
const bodyParser = require('body-parser')


app.use(express.json())
app.use(cors())
app.use(bodyParser.json())
dotenv.config()

const port = process.env.PORT
const url = process.env.MONGODB_URL

mongoose.connect(url)
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.log('Failed to connect to MongoDB', error))

const characterRoute = require("./character")
app.use('/character', characterRoute)



app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})