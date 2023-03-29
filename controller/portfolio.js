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
}

function uploadSingleIcons(base64, delete_id){
    if(base64.includes('https://drive.google.com')) {
        console.log(base64)
        return base64.split('=').at(-1);
    }   

    return new Promise(async (resolve, reject) => {
        const drive = google.drive({
            version: 'v3',
            auth: jwtClient
        }); 

        // Base64-encoded image data
        const base64Data = base64;

        // Remove the data URI prefix and create a buffer from the base64-encoded data
        const imageData = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        const imageBuffer = Buffer.from(imageData, 'base64');
        const mimeType = `image/${getExtensionName(base64)}`;

        const fileMetadata = {
            name: filename(base64),
            parents: ['1GdrQDlW5rkUREbsHZF71cuAp3wPLv-BT']
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
                    console.error('Error uploading image', err.errors);
                    return id
                } else {
                    if (err) {
                        console.log(err)
                        reject(err);
                    } else {
                        console.log("FILE ADDED", file.data.id)
                        resolve(file.data.id);
                    }
                }
            });
        }
        catch(error) {
            console.log(err)
            reject(error);
        }
    })
}

function deleteSingleIcons (delete_id) {
    return new Promise(async (resolve, reject) => {
        const drive = google.drive({
            version: 'v3',
            auth: jwtClient
        });

        let fileID = delete_id.split('=').at(-1)
        try {
            drive.files.delete({ 
                fileId: fileID,
                resource: {
                    parents: ['1GdrQDlW5rkUREbsHZF71cuAp3wPLv-BT']
                }
            }, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(delete_id);
                }
            });
        }
        catch (err){ 
            reject(err);
        }
    })
}

exports.uploadSkills = async (req, res) => {
    jwtClient.authorize(async (err, tokens) => {
        const { id, icons, description, project_completed, heading, skill, removed_icons } = req.body

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
                parents: ['1v921uDgp9PBy2GvF4sEW8uBn17wIrPrb']
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
                        let icon_id = []
                        let icon_removed_id = []

                        if(icons.length > 0){

                            icons.forEach((icon) => {
                                icon_id.push(uploadSingleIcons(icon))
                            })

                            Promise.all(icon_id)
                                .then(async (newImageID) => {
                                    removed_icons.forEach((item) => {
                                        icon_removed_id.push(deleteSingleIcons(item))
                                    })

                                    Promise.all(icon_removed_id)
                                        .then(async () => {
                                            let image_arr = []

                                            newImageID.forEach((image_id) => {
                                                image_arr.push(`https://drive.google.com/uc?export=view&id=${image_id}`)
                                            })

                                            const imagePath = `https://drive.google.com/uc?export=view&id=${file.data.id}`

                                            const skills = { 
                                                image: imagePath, 
                                                icons: image_arr, 
                                                description: description, 
                                                skill: skill, 
                                                heading: heading, 
                                                project_completed: project_completed 
                                            }

                                            const newPortfolio = new Portfolio({ user: id, skills })

                                            if(!existing.portfolio_id){
                                                await newPortfolio.save().then(async (result) => {
                                                    await Users.findByIdAndUpdate(id, {portfolio_id: result._id}, {new: true})
                                                });
                                    
                                                let user = await Users.findById(id).populate('portfolio_id')
                                                return res.status(200).json({
                                                    variant: 'success',
                                                    alert: "Skills data successfully added!",
                                                    result: user.portfolio_id
                                                });
                                            }
                                            else {             
                                                await Portfolio.findByIdAndUpdate(existing.portfolio_id, { ...skills, skills }, {new: true})
                                                .then(async (data) => {
                                                    let user = await Users.findById(id).populate('portfolio_id')

                                                    if(existing.portfolio_id.skills.image) {
                                                        let fileID = existing.portfolio_id.skills.image.split('=').at(-1)

                                                        try {
                                                            drive.files.delete({ 
                                                                fileId: fileID,
                                                                resource: {
                                                                    parents: ['1v921uDgp9PBy2GvF4sEW8uBn17wIrPrb']
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
                                                    }
                                                    return res.status(200).json({
                                                        variant: 'success',
                                                        alert: "Skills successfully updated!",
                                                        result: user.portfolio_id
                                                    });
                                                })
                                            }
                                        })
                                        .catch((e) => {
                                            console.log(e)
                                        });
                                })
                                .catch((e) => {
                                    console.log(e)
                                });
                        }
                        else {
                            let icon_removed_id = []

                            existing.portfolio_id.skills.icons.forEach((item) => {
                                icon_removed_id.push(deleteSingleIcons(item))
                            })

                            Promise.all(icon_removed_id)
                                .then(async () => {
                                    const imagePath = `https://drive.google.com/uc?export=view&id=${file.data.id}`

                                    const skills = { 
                                        image: imagePath, 
                                        icons: icons, 
                                        description: description, 
                                        skill: skill, 
                                        heading: heading, 
                                        project_completed: project_completed 
                                    }

                                    const newPortfolio = new Portfolio({ user: id, skills })

                                    if(!existing.portfolio_id){
                                        await newPortfolio.save().then(async (result) => {
                                            await Users.findByIdAndUpdate(id, {portfolio_id: result._id}, {new: true})
                                        });
                            
                                        let user = await Users.findById(id).populate('portfolio_id')
                                        return res.status(200).json({
                                            variant: 'success',
                                            alert: "Skills data successfully added!",
                                            result: user.portfolio_id
                                        });
                                    }
                                    else {             
                                        await Portfolio.findByIdAndUpdate(existing.portfolio_id, { ...skills, skills }, {new: true})
                                        .then(async () => {
                                            let user = await Users.findById(id).populate('portfolio_id')
                                            let fileID = existing.portfolio_id.skills.image.split('=').at(-1)

                                            try {
                                                drive.files.delete({ 
                                                    fileId: fileID,
                                                    resource: {
                                                        parents: ['1v921uDgp9PBy2GvF4sEW8uBn17wIrPrb']
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
                                                alert: "Skills successfully updated!",
                                                result: user.portfolio_id
                                            });
                                        })
                                    }
                                })
                                .catch((e) => {
                                    console.log(e)
                                });
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
            let icon_id = []
            let icon_removed_id = []

            if(icons.length > 0){

                icons.forEach((icon) => {
                    icon_id.push(uploadSingleIcons(icon))
                })

                Promise.all(icon_id)
                    .then(async (newImageID) => {
                        removed_icons.forEach((item) => {
                            icon_removed_id.push(deleteSingleIcons(item))
                        })

                        Promise.all(icon_removed_id)
                            .then(async () => {
                                let image_arr = []

                                newImageID.forEach((image_id) => {
                                    image_arr.push(`https://drive.google.com/uc?export=view&id=${image_id}`)
                                })

                                const skills = { 
                                    image: existing.portfolio_id.skills.image, 
                                    icons: image_arr, description: description, 
                                    skill: skill, 
                                    heading: heading, 
                                    project_completed: 
                                    project_completed 
                                }

                                const newPortfolio = new Portfolio({ user: id, skills })

                                if(!existing.portfolio_id){
                                    await newPortfolio.save().then(async (result) => {
                                        await Users.findByIdAndUpdate(id, {portfolio_id: result._id}, {new: true})
                                    });
                        
                                    let user = await Users.findById(id).populate('portfolio_id')
                                    return res.status(200).json({
                                        variant: 'success',
                                        alert: "Skills data successfully added!",
                                        result: user.portfolio_id
                                    });
                                }
                                else {             
                                    await Portfolio.findByIdAndUpdate(existing.portfolio_id, { ...skills, skills }, {new: true})
                                    .then(async () => {
                                        let user = await Users.findById(id).populate('portfolio_id')

                                        return res.status(200).json({
                                            variant: 'success',
                                            alert: "Skills successfully updated!",
                                            result: user.portfolio_id
                                        });
                                    })
                                }
                            })
                            .catch((e) => {
                                console.log(e)
                            });
                    })
                    .catch((e) => {
                        console.log(e)
                    });
            }
            else {
                let icon_removed_id = []

                existing.portfolio_id.skills.icons.forEach((item) => {
                    icon_removed_id.push(deleteSingleIcons(item))
                })

                Promise.all(icon_removed_id)
                    .then(async () => {

                        const skills = { 
                            image: existing.portfolio_id.skills.image, 
                            icons: icons, 
                            description: description, 
                            skill: skill, 
                            heading: heading, 
                            project_completed: 
                            project_completed 
                        }

                        const newPortfolio = new Portfolio({ user: id, skills })

                        if(!existing.portfolio_id){
                            await newPortfolio.save().then(async (result) => {
                                await Users.findByIdAndUpdate(id, {portfolio_id: result._id}, {new: true})
                            });
                
                            let user = await Users.findById(id).populate('portfolio_id')
                            return res.status(200).json({
                                variant: 'success',
                                alert: "Skills data successfully added!",
                                result: user.portfolio_id
                            });
                        }
                        else {             
                            await Portfolio.findByIdAndUpdate(existing.portfolio_id, { ...skills, skills }, {new: true})
                            .then(async (data) => {
                                let user = await Users.findById(id).populate('portfolio_id')

                                return res.status(200).json({
                                    variant: 'success',
                                    alert: "Skills successfully updated!",
                                    result: user.portfolio_id
                                });
                            })
                        }
                    })
                    .catch((e) => {
                        console.log(e)
                    });
            }
        }
    });
}
