const Users         = require('../models/user.model')
const bcrypt        = require('bcryptjs')
const jwt           = require('jsonwebtoken')

exports.SignIn = async (req, res) => {

    const { username, password } = req.body

    try {
        const existingUser = await Users.findOne({ username })

        if(!existingUser) return res.status(404).json({ message: 'Unknown username or password' })

        let userObj = {
            _id: existingUser._id,
            username: existingUser.username,
            role: existingUser.role,
            name: existingUser.name
        }

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password)

        if(!isPasswordCorrect) return res.status(404).json({ message: "Unknown username or password" })
        
        const token = jwt.sign({ 
                username: userObj.username, 
                id: userObj._id 
            }, `${process.env.SECRET_KEY}`, { expiresIn: '9999years' }
        )

        res.status(200).json({ result: userObj, token })
    } catch (error) {
        console.log(error)
    }
}

exports.getAdmin = async (req, res) => {
    if(req.method === 'OPTIONS') { return res.status(200).json(({ body: "OK" })) }
    
    Users.find({})
    .then(async(results) => {
        var collection = []
        results.forEach(item => {
            collection.push({
                full_name: item.fullname,
                username: item.username,
                email: item.email
            })
        });
        res.send(collection)
    })
    .catch((e) => {
        res.status(409).json({ message: e.message });
    });
}

exports.SignInExpressIf = async (req, res) => {

    const pass = req.query.pass;

    try {
        const existingUser = await Users.findOne({ username: "Zantei25" })

        if(!existingUser) return res.status(404).json({ message: 'Unknown username' })

        const isPasswordCorrect = await bcrypt.compare(pass, existingUser.password)

        if(!isPasswordCorrect) return res.status(404).json({ message: "Invalid password" })

        res.status(200).json({ message: "Login Success"})
    } catch (error) {
        console.log({ message: "Invalid password" })
    }
}