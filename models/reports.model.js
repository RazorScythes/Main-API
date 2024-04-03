const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const reportsSchema = new Schema({
    content_id: { type: String },
    type: { type: String },
    name: { type: String },
    email: { type: String },
    reason: { type: String },
    details: { type: String },
},{
    timestamps: true,
    collection: "reports"
})

const Reports = mongoose.model('Reports', reportsSchema)

module.exports = Reports