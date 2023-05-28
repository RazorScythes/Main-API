const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const gameSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref:'User'
    },
    feature_image: { type: String },
    title: { type: String },
    description: { type: String },
    tags: { type: Array },
    gallery: { type: Array},
    download_link: { type: Array },
    details: {
        latest_version: { type: String },
        censorship: { type: String },
        language: { type: String },
        developer: { type: String },
        upload_date: { type: String },
        platform: { type: String }
    },
    leave_uploader_message: { type: String },
    download_count: { type: Number },
    ratings: { type: Array }
},{
    timestamps: true,
    collection: "game"
})

const Game = mongoose.model('Game', gameSchema)

module.exports = Game