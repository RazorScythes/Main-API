const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const projectSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref:'User'
    },
    featured_image: { type: String },
    categories: { type: String },
    post_title: { type: String },
    date_start: { type: String },
    date_end: { type: String },
    created_for: { type: String },
    likes: { type: [String] },
    content: { type: Array },
    tags: { type: Array },
    dislikes: { type: [String] },
    views: { type: Array },
    comment: { type: Array },
    strict: { type: Boolean },
    privacy: { type: Boolean },
},{
    timestamps: true,
    collection: "project"
})

const Project = mongoose.model('Project', projectSchema)

module.exports = Project