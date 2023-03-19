const Users         = require('../models/user.model')
const bcrypt        = require('bcryptjs')
const jwt           = require('jsonwebtoken')

exports.SignIn = async (req, res) => {
    const { username, password } = req.body

    try {
        const existingUser = await Users.findOne({ username }).populate('alumni_id')
        
        if(!existingUser) return res.status(404).json({ message: 'User does not exist.' })

        let userObj = {
            _id: existingUser._id,
            username: existingUser.username,
            role: existingUser.role,
            name: existingUser.name
        }

        if(existingUser.alumni_id) {
            userObj.alumni_id = existingUser.alumni_id._id
            userObj.student_number = existingUser.alumni_id.student_number
        }

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password)

        if(!isPasswordCorrect) return res.status(404).json({ message: "Invalid credentials" })
        
        const token = jwt.sign({ email: userObj.username, id: userObj._id }, `${process.env.SECRET_KEY}`, { expiresIn: '9999years' } )
        
        res.status(200).json({ result: userObj, token })
    } catch (error) {
        console.log(error)
    }
}

exports.getAdmin = async (req, res) => {
    Users.find({})
    .then(async(results) => {
        res.send(`accounts: ${results}`)
    })
    .catch((e) => {
        res.status(409).json({ message: e.message });
    });
}