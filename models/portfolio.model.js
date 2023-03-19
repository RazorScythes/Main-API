const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const portfolioSchema = new Schema({
    full_name: {
        first_name: { type: String },
        middle_name: { type: String },
        last_name: { type: String }
    }
},{
    timestamps: true,
    collection: "portfolio"
})

const Portfolio = mongoose.model('Portfolio', portfolioSchema)

module.exports = Portfolio