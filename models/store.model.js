const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const storeSchema = new Schema({
    feature_image: { type: String },
    title: { type: String },
    content: { type: String}, 
    stocks: { type: Number },
    ratings: { type: Number },
    gallery: { type: Array},
    download_link: { type: String },
    sold: { type: Number },
    reviews: {
        user: {
            type: Schema.Types.ObjectId,
            ref:'User'
        },
        comment: { type: String },
        likes: { type: Number }
    }
},{
    timestamps: true,
    collection: "store"
})

const Store = mongoose.model('Store', storeSchema)

module.exports = Store