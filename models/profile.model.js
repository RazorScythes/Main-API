const mongoose      = require('mongoose')
const { stringify } = require('querystring')
const Schema        = mongoose.Schema

const profileSchema = new Schema({
    likes: { type: Number },
    comments: {
        toUser: { type: String },
        message: { type: String },
        date: { 
            type: String,
            default: Date.now
        },
        likes: { type: Number}
    },
    reply: {
        toUser: { type: String },
        message: { type: String },
        date: { 
            type: String,
            default: Date.now
        },
        likes: { type: Number}
    },
    posts: {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        category: { type: String },
        title: { type: String},
        content: { type: String },
        images: { type: Array },
        link: { type: String }
    },
    private_message: {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        reciever: { 
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        anonymous: { type: String },
        message: {

        },
        info: { type: String },
        status: { type: String },
        color: { type: String },
    },
    settings: {
        restrictContent: { type: Boolean }
    },
    archive_id: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    store_id: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    games_id: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    portfolio_id: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
},{
    timestamps: true,
    collection: "profile"
})

const Profile = mongoose.model('Profile', profileSchema)

module.exports = Profile