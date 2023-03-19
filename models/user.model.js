const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = Schema({
    avatar: { type: String },
    username: { type: String },
    email: { type: String },
    password: { type: String },
    role: { type: String },
    profile_id: {
        type: Schema.Types.ObjectId,
        ref: 'Profile'
    },
    reset_password: { type: Boolean },
    verified: { type: Boolean }
},{
    timestamps: true
})

const User = mongoose.model('User', userSchema)

module.exports = User