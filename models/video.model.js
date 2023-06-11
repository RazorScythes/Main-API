const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const videoSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref:'User'
    },
    owner: { type: String },
    link: { type: String },
    title: { type: String },
    likes: { type: [String] },
    tags: { type: Array },
    dislikes: { type: [String] },
    views: { type: Array },
    comment: { type: Array },
    strict: { type: Boolean },
    privacy: { type: Boolean },
    downloadable: { type: Boolean },
    related_videos: { type: Array },
    file_size: { type: String }
},{
    timestamps: true,
    collection: "video"
})

const Video = mongoose.model('Video', videoSchema)

module.exports = Video