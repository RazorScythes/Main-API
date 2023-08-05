const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const archiveNameSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref:'User'
    },
    archive_name: { type: String },
    archive_list: { 
        type: Array ,
        default: ['Default Archive']
    }
},{
    timestamps: true,
    collection: "archiveName"
})

const ArchiveName = mongoose.model('ArchiveName', archiveNameSchema)

module.exports = ArchiveName