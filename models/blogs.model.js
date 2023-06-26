const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const blogSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref:'User'
    },
    featured_image: { type: String },
    secondary_featured_image: { type: String },
    categories: { type: String },
    post_title: { type: String },
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
    collection: "blog"
})

const Blog = mongoose.model('Blog', blogSchema)

module.exports = Blog