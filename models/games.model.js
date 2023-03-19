const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const gameSchema = new Schema({
    feature_image: { type: String },
    title: { type: String },
    content: { type: String}, 
    tags: { type: Array },
    gallery: { type: Array},
    download_link: { type: String }
},{
    timestamps: true,
    collection: "game"
})

const Game = mongoose.model('Game', gameSchema)

module.exports = Game