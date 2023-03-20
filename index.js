const https                     = require('https');
const hsts                      = require('hsts')
const express                   = require('express')
const cors                      = require('cors')
const morgan                    = require('morgan')
const path                      = require('path')
const mongoose                  = require('mongoose')
const User                      = require('./models/user.model')
const bcrypt                    = require("bcryptjs")
const auth_router               = require('./api/auth')

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

// Define the allowCors middleware
const allowCors = fn => async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, OPTIONS, DELETE');
    
    if(req.method === 'OPTIONS') {
        return res.status(200).json(({
            body: "OK"
        }))
    }
};


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

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

const handleGet = (req, res) => {
    res.send('This is a GET request');
};

app.get("/", handleGet)

app.use(express.json({limit: '150mb'}))

app.use(cors({
    credentials: true, 
}))

app.use(express.static(path.join(__dirname,'/public')));

app.use('/auth', allowCors(auth_router))



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