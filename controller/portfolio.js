const Users                 = require('../models/user.model')
const Portfolio             = require('../models/portfolio.model')
const path                  = require('path')
const ba64                  = require("ba64")
const uuid                  = require('uuid');

function filename(base64String){
    return (uuid.v4() + path.extname(getExtensionName(base64String)))
}

function getExtensionName(base64String){
    return base64String.substring("data:image/".length, base64String.indexOf(";base64"))
}

exports.uploadHero = async (req, res) => {
    console.log(req.body)

    let image = filename(req.body.image)
    
    if(req.body) {
        ba64.writeImageSync(`public/portfolio_hero_image/${image}`, req.body.image, function(err){
            if (err) throw err;     
            console.log(`${image} saved successfully`);
        });
    }   

    return res.status(404).json({ message: "Unknown username or password" })
}