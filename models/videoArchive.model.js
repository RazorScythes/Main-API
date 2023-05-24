const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const videoArchive = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref:'User'
    },
    video: {
        type: Schema.Types.ObjectId,
        ref:'Video'
    }
},{
    timestamps: true,
    collection: "videoArchive"
})

const VideoArchive = mongoose.model('VideoArchive', videoArchive)

module.exports = VideoArchive