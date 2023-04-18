const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const logsSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    viewer: { type: String },
    subject: { type: String },
    message: { type: String }
},{
    timestamps: true,
    collection: "logs"
})

const Logs = mongoose.model('Logs', logsSchema)

module.exports = Logs