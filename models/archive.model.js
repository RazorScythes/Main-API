const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const archiveSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref:'User'
    },
    archive_name: {
        type: Schema.Types.ObjectId,
        ref: 'ArchiveName'
    },
    directory_name: { type: String },
    content_type: { type: String },
    content_id: { type: String },
},{
    timestamps: true,
    collection: "archive"
})

const Archive = mongoose.model('Archive', archiveSchema)

module.exports = Archive