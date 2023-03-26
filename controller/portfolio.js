const Users                 = require('../models/user.model')
const Portfolio             = require('../models/portfolio.model')
const path                  = require('path')
const ba64                  = require("ba64")
const uuid                  = require('uuid');

const image_folder = 'portfolio_hero_image'

require('dotenv').config()

function filename(base64String){
    return (uuid.v4() + path.extname(getExtensionName(base64String)))
}

function getExtensionName(base64String){
    return base64String.substring("data:image/".length, base64String.indexOf(";base64"))
}

exports.getPortfolio = async (req, res) => {
    const { id } = req.body
    await Users.findById(id).populate('portfolio_id')
        .then(user => res.status(200).json({ result: user.portfolio_id }))
        .catch(err => res.status(404).json({ variant: 'danger', message: err }))
}

exports.uploadHero = async (req, res) => {
    const { id, full_name, description, profession, animation } = req.body
    let existing = await Users.findById(req.body.id)

    let image_path = ''

    if(req.body.image) {
        let image = filename(req.body.image)
        ba64.writeImage(`tmp/${image_folder}/${image}`, req.body.image, function(err){
            if (err) throw err;     
            console.log(`${image} saved successfully`);
        });
        image_path = `${process.env.DOMAIN}${image_folder}/${image}.${getExtensionName(req.body.image)}`
    }   

    const hero = { image: image_path, full_name: full_name, description: description, profession: profession, animation: animation }

    if(!image_path) delete hero['image']

    const newPortfolio = new Portfolio({ user: id, hero })

    try {
        if(!existing.portfolio_id){
            await newPortfolio.save().then(async (result) => {
                await Users.findByIdAndUpdate(id, {portfolio_id: result._id}, {new: true})
            });

            let user = await Users.findById(id).populate('portfolio_id')
            res.status(200).json({
                variant: 'success',
                alert: "Hero data successfully added!",
                result: user.portfolio_id
            });
        }
        else {
            await Portfolio.findByIdAndUpdate(existing.portfolio_id, { ...hero, hero }, {new: true})
            .then(async (data) => {
                let user = await Users.findById(id).populate('portfolio_id')
                res.status(200).json({
                    variant: 'success',
                    alert: "Hero successfully updated!",
                    result: user.portfolio_id
                });
            })
        }
    } catch (error) {
        res.status(409).json({ 
            variant: 'danger',
            message: "409: there was a problem with the server."
        });
    }
}