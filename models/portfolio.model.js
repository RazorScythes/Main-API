const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const portfolioSchema = new Schema({
    published: { type: Boolean },
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
    projects: {
        showcase: {
            image: { type: String },
            project_name: { type: String },
            category: { type: String }
        },
        description: { type: String },
        gallery: { type: Array },
        website_link: { type: String }
    }
},{
    timestamps: true,
    collection: "portfolio"
})

const Portfolio = mongoose.model('Portfolio', portfolioSchema)

module.exports = Portfolio