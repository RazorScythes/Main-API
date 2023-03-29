const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const portfolioSchema = new Schema({
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
    services: {
        heading: { type: String },
        description: { type: String },
        service: {
            name: { type: String },
            type_of_service: { type: Array },
        }
    },
    experience: {
        year_start: { type: String },
        year_end: { type: String },
        company_logo: { type: String },
        company_name: { type: String },
        company_website: { type: String },
        position: { type: String }
    },
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