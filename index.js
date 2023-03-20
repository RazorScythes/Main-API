const https                     = require('https');
const hsts                      = require('hsts')
const express                   = require('express')
const cors                      = require('cors')
const morgan                    = require('morgan')
const path                      = require('path')
const mongoose                  = require('mongoose')
const User                      = require('./models/user.model')
const bcrypt                    = require("bcryptjs")
const auth_router               = require('./routes/auth')

require('dotenv').config()

const app = express()
const port = process.env.PORT || 3000

const db = mongoose.connection

mongoose.connect(`mongodb+srv://vercel-admin-user:YULFVGWrH8jmI4Ef@cluster0.idzctai.mongodb.net/main?retryWrites=true&w=majority`, 
{   
    useNewUrlParser: true, 
    useUnifiedTopology: true
})
.then(() => {
    app.listen(port, (err) => {
        if(err) throw err
        console.log(`Server is running on PORT: ${port}`)
    })
})

db.once('open', () => {
    console.log('Database Connection Established')
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
    res.send("This API is working Properly")
})

app.use(express.json({limit: '150mb'}))

app.use(cors({credentials: true, origin: true}))

app.use(express.static(path.join(__dirname,'/public')));

app.use('/auth', auth_router)



/*
    Creating Admin by Default
*/
async function defaultAdmin() {
    let default_admin = await User.find({username: 'admin'})
    if(default_admin.length > 0) return

    let password = "admin"

    try {
        let hashedPassword = await bcrypt.hash(password, 12);

        const newAccount = new User({
            role : "Admin",
            email: "jamesarviemaderas@gmail.com",
            username : 'admin',
            password: hashedPassword
        })
        await newAccount.save().then("Default Admin created");

    } catch (error) {
        console.log(error)
    }
}

defaultAdmin()