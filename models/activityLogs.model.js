const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const activityLogsSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    type: { type: String },
    method: { type: String },
    message: { type: String },
    id: { type: String },
    reference: { type: String }
},{
    timestamps: true,
    collection: "activity_logs"
})

const ActivityLogs = mongoose.model('ActivityLogs', activityLogsSchema)

module.exports = ActivityLogs