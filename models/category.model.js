const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const categorySchema = new Schema({
    icon: { type: String },
    category: { type: String },
    shortcut: { type: String },
    type: { type: String },
    background: { type: String }
},{
    timestamps: true,
    collection: "category"
})

const Category = mongoose.model('Category', categorySchema)

module.exports = Category