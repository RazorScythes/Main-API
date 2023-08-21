const mongoose      = require('mongoose')
const Schema        = mongoose.Schema
const moment = require('moment-timezone');

const archiveNameSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref:'User'
    },
    archive_name: { type: String },
    archive_list: { 
        type: Array,
        default: {
            name: 'Default Archive',
            privacy: 'public',
            updated: moment().tz('UTC').format('YYYY-MM-DDTHH:mm:ss.SSSZ')
        }
    },
    bg_color: { type: String },
    icon_bg_color: { type: String },
    icon_color: { type: String },
    icon: { type: String }
},{
    timestamps: true,
    collection: "archiveName"
})

const ArchiveName = mongoose.model('ArchiveName', archiveNameSchema)

module.exports = ArchiveName