const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const videoSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref:'User'
    },
    link: { type: String },
    title: { type: String },
    likes: { type: [String] },
    tags: { type: Array },
    dislikes: { type: [String] },
    views: { type: Number, default: 0 },
    comment: { type: Array },
},{
    timestamps: true,
    collection: "video"
})

const Video = mongoose.model('Video', videoSchema)

module.exports = Video