const Users                 = require('../models/user.model')
const Portfolio             = require('../models/portfolio.model')
const path                  = require('path')
const ba64                  = require("ba64")
const uuid                  = require('uuid');
const fs                    = require('fs');
const { google }            = require('googleapis');
const { Readable }          =  require('stream')

const image_folder = 'portfolio_hero_image'

require('dotenv').config()

const key = require('../service-account-key-file.json');

const jwtClient = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    ['https://www.googleapis.com/auth/drive.file'],
    null
);

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
    jwtClient.authorize(async (err, tokens) => {
        const { id, full_name, description, profession, animation } = req.body
        let existing = await Users.findById(req.body.id).populate('portfolio_id')

        if (err) {
            return res.status(409).json({ 
                variant: 'danger',
                message: "409: Error while trying to authorize JWT client."
            });
        }
        
        if(req.body.image) {
            const drive = google.drive({
            version: 'v3',
            auth: jwtClient
            });

            // Base64-encoded image data
            const base64Data = req.body.image;

            // Remove the data URI prefix and create a buffer from the base64-encoded data
            const imageData = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
            const imageBuffer = Buffer.from(imageData, 'base64');
            const mimeType = `image/${getExtensionName(req.body.image)}`;

            const fileMetadata = {
                name: filename(req.body.image),
                parents: ['1nv7HJrqyajTqbKjbcBvkU3Fg4qXgVN_3']
            };

            const media = {
                mimeType: mimeType,
                body: Readable.from(imageBuffer)
            };

            try {
                drive.files.create({
                    resource: fileMetadata,
                    media: media,
                    fields: 'id'
                }, async (err, file) => {
                    if (err) {
                        console.error('Error uploading image', err);
                        return res.status(409).json({ 
                            variant: 'danger',
                            message: "500: Error uploading image."
                        });
                    } else {
                        const imagePath = `https://drive.google.com/uc?export=view&id=${file.data.id}`

                        const hero = { image: imagePath, full_name: full_name, description: description, profession: profession, animation: animation }

                        const newPortfolio = new Portfolio({ user: id, hero })

                        if(!existing.portfolio_id){
                            await newPortfolio.save().then(async (result) => {
                                await Users.findByIdAndUpdate(id, {portfolio_id: result._id}, {new: true})
                            });
                
                            let user = await Users.findById(id).populate('portfolio_id')
                            return res.status(200).json({
                                variant: 'success',
                                alert: "Hero data successfully added!",
                                result: user.portfolio_id
                            });
                        }
                        else {             
                            await Portfolio.findByIdAndUpdate(existing.portfolio_id, { ...hero, hero }, {new: true})
                            .then(async (data) => {
                                let user = await Users.findById(id).populate('portfolio_id')
                                let fileID = existing.portfolio_id.hero.image.split('=').at(-1)

                                try {
                                    drive.files.delete({ 
                                        fileId: fileID,
                                        resource: {
                                            parents: ['1nv7HJrqyajTqbKjbcBvkU3Fg4qXgVN_3']
                                        }
                                    }, (err, res) => {
                                        if (err) {
                                          console.error('Error deleting file', err);
                                          return;
                                        }
                                      
                                        console.log('File deleted successfully');
                                    });
                                }
                                catch (err){
                                    console.log(err)
                                }

                                return res.status(200).json({
                                    variant: 'success',
                                    alert: "Hero successfully updated!",
                                    result: user.portfolio_id
                                });
                            })
                        }
                    }
                });
            }
            catch(error) {
                return res.status(409).json({ 
                    variant: 'danger',
                    message: "409: there was a problem with the server."
                });
            }
        }
        else {
            const hero = { full_name: full_name, description: description, profession: profession, animation: animation }

            const newPortfolio = new Portfolio({ user: id, hero })

            try {
                if(!existing.portfolio_id){
                    await newPortfolio.save().then(async (result) => {
                        await Users.findByIdAndUpdate(id, {portfolio_id: result._id}, {new: true})
                    });

                    let user = await Users.findById(id).populate('portfolio_id')
                    return res.status(200).json({
                        variant: 'success',
                        alert: "Hero data successfully added!",
                        result: user.portfolio_id
                    });
                }
                else {
                    hero['image'] = existing.portfolio_id.hero.image

                    await Portfolio.findByIdAndUpdate(existing.portfolio_id, { ...hero, hero }, {new: true})
                    .then(async (data) => {
                        let user = await Users.findById(id).populate('portfolio_id')
                        return res.status(200).json({
                            variant: 'success',
                            alert: "Hero successfully updated!",
                            result: user.portfolio_id
                        });
                    })
                }
            } catch (error) {
                return res.status(409).json({ 
                    variant: 'danger',
                    message: "409: there was a problem with the server."
                });
            }
        }
    });
    return
    const { id, full_name, description, profession, animation } = req.body
    let existing = await Users.findById(req.body.id).populate('portfolio_id')

    let image_path = ''

    if(req.body.image) {
        // let image = filename(req.body.image)
        // ba64.writeImage(`tmp/${image_folder}/${image}`, req.body.image, function(err){
        //     if (err) throw err;     
        //     console.log(`${image} saved successfully`);
        // });
        // image_path = `${process.env.DOMAIN}${image_folder}/${image}.${getExtensionName(req.body.image)}`
        image_path = req.body.image
    }   

    const hero = { image: image_path, full_name: full_name, description: description, profession: profession, animation: animation }

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
            if(!image_path) 
                if(existing.portfolio_id.hero)
                    hero['image'] = existing.portfolio_id.hero.image

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
        console.log(error)
        res.status(409).json({ 
            variant: 'danger',
            message: "409: there was a problem with the server."
        });
    }
}

exports.uploadHero2 = async (req, res) => {
    const { id, full_name, description, profession, animation } = req.body
    let existing = await Users.findById(req.body.id).populate('portfolio_id')

    let image_path = ''

    if(req.body.image) {
        // let image = filename(req.body.image)
        // ba64.writeImage(`tmp/${image_folder}/${image}`, req.body.image, function(err){
        //     if (err) throw err;     
        //     console.log(`${image} saved successfully`);
        // });
        // image_path = `${process.env.DOMAIN}${image_folder}/${image}.${getExtensionName(req.body.image)}`
        image_path = req.body.image
    }   

    const hero = { image: image_path, full_name: full_name, description: description, profession: profession, animation: animation }

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
            if(!image_path) 
                if(existing.portfolio_id.hero)
                    hero['image'] = existing.portfolio_id.hero.image

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
        console.log(error)
        res.status(409).json({ 
            variant: 'danger',
            message: "409: there was a problem with the server."
        });
    }
}