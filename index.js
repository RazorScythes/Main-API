const hsts                      = require('hsts')
const express                   = require('express')
const cors                      = require('cors')
const morgan                    = require('morgan')
const path                      = require('path')
const mongoose                  = require('mongoose')
const User                      = require('./models/user.model')
const bcrypt                    = require("bcryptjs")
// const cookieParser              = require('cookie-parser')
// const expressSession            = require('express-session')
const auth_router               = require('./api/auth')
const portfolio_router          = require('./api/portfolio')
const settings_router           = require('./api/settings')
const logs_router               = require('./api/logs')
const video_router              = require('./api/video')
const upload_router             = require('./api/uploads')
const game_router               = require('./api/game')
const blog_router               = require('./api/blogs')
const archive_router            = require('./api/archive')

const app = express()
const port = 3000

const db = mongoose.connection

//ba64 cookie-parser multer 
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

// app.use(
//     expressSession({
//       name: "SESS_NAME",
//       secret: "SESS_SECRET",
//       saveUninitialized: false,
//       resave: false,
//       cookie: {
//         domain:'.localhost:5173',
//         secure: process.env.PRODUCTION === "YES",
//         maxAge: 31536000,
//         httpOnly: true,
//       },
//     })
// );

// app.use(cookieParser())
app.use(hsts({
    maxAge: 31536000,        // Must be at least 1 year to be approved
    includeSubDomains: true, // Must be enabled to be approved
    preload: true
}))

app.use(morgan('dev'))
app.use(express.urlencoded({
    limit: '55mb',
    parameterLimit: 100000,
    extended: true 
}))

const handleGet = (req, res) => {
    res.cookie(`Cookie token name`,`encrypted cookie string Value`);
    res.send(`
        This is a GET request <br/>
        Sample Environment Variable: ${process.env.HANDLE_VALUE}
    `);
};

app.get("/", handleGet)

app.use(express.json({limit: '150mb'}))

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', req.header('origin') );
    next();
});

app.use(cors({
    origin: function(origin, callback){
      return callback(null, true);
    },
    optionsSuccessStatus: 200,
    credentials: true
}))

app.use(express.static(path.join(__dirname,'/tmp')));

app.use('/auth', auth_router)
app.use('/portfolio', portfolio_router)
app.use('/settings', settings_router)
app.use('/logs', logs_router)
app.use('/video', video_router)
app.use('/uploads', upload_router)
app.use('/game', game_router)
app.use('/blogs', blog_router)
app.use('/archive', archive_router)

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
        await newAccount.save().then(console.log("Default Admin created"));

    } catch (error) {
        console.log(error)
    }
}

defaultAdmin()
