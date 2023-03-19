const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const archiveSchema = new Schema({
    feature_image: { type: String },
    title: { type: String },
    content: { type: String}, 
    gallery: { type: Array},
    download_link: { type: String }
},{
    timestamps: true,
    collection: "archive"
})

const Archive = mongoose.model('Archive', archiveSchema)

module.exports = Archive