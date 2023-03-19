const https             = require('https');
const hsts              = require('hsts')
const express           = require('express')
const cors              = require('cors')
const morgan            = require('morgan')
const path              = require('path')

require('dotenv').config()

const app = express()
const port = process.env.PORT || 3000

app.listen(port, (err) => {
    if(err) throw err
    console.log(`Server is running on PORT: ${port}`)
})

app.use(hsts({
    maxAge: 31536000,        // Must be at least 1 year to be approved
    includeSubDomains: true, // Must be enabled to be approved
    preload: true
}))

app.use(morgan('dev'))
app.use(express.urlencoded({
    limit: '50mb',
    parameterLimit: 100000,
    extended: true 
}))


app.get("/", (req, res) => {
    console.log("OK")
    res.send("ok")
})

app.use(express.json({limit: '150mb'}))

app.use(cors())

app.use(express.static(path.join(__dirname,'/public')));