const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const portfolioSchema = new Schema({
    published: { type: Boolean },
    visited: { type: Array },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    hero: {
        image: { type: String },
        full_name: { type: String },
        description: { type: String },
        profession: { type: Array },
        animation: { type: Boolean }
    },
    skills: {
        image: { type: String },
        icons: { type: Array },
        project_completed: { type: String },
        heading: { type: String },
        description: { type: String },
        skill: { type: Array }
    },
    services: { type: Array },
    experience: { type: Array },
    projects: { type: Array },
    contact: {
        email: { type: String },
        subject: { type: Array }
    }
},{
    timestamps: true,
    collection: "portfolio"
})

const Portfolio = mongoose.model('Portfolio', portfolioSchema)

module.exports = Portfolio