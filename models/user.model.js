const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = Schema({
    full_name: { type: String },
    avatar: { type: String },
    username: { type: String },
    email: { type: String },
    password: { type: String },
    role: { type: String },
    profile_id: {
        type: Schema.Types.ObjectId,
        ref: 'Profile'
    },
    portfolio_id: {
        type: Schema.Types.ObjectId,
        ref: 'Portfolio'
    },
    reset_password: { type: Boolean },
    verified: { type: Boolean }
},{
    timestamps: true
})

const Users = mongoose.model('User', userSchema)

module.exports = Users