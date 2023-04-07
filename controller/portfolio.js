const Users                 = require('../models/user.model')
const Portfolio             = require('../models/portfolio.model')
const path                  = require('path')
const uuid                  = require('uuid');
const nodemailer            = require('nodemailer');
const { google }            = require('googleapis');
const { Readable }          =  require('stream')

var transporter = null 
var jwtClient = null

if(process.env.PRODUCTION) {
    jwtClient = new google.auth.JWT(
        process.env.CLIENT_EMAIL,
        null,
        process.env.PRIVATE_KEY,
        ['https://www.googleapis.com/auth/drive.file'],
        null
    );

    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        }
    });
}
else {
    require('dotenv').config()

    jwtClient = new google.auth.JWT(
        process.env.CLIENT_EMAIL,
        null,
        process.env.PRIVATE_KEY,
        ['https://www.googleapis.com/auth/drive.file'],
        null
    );

    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_EMAIL,
            pass: process.env.GMAIL_PASSWORD
        }
    });
}


function filename(base64String){
    return (uuid.v4() + path.extname(getExtensionName(base64String)))
}

function getExtensionName(base64String){
    return base64String.substring("data:image/".length, base64String.indexOf(";base64"))
}

exports.publishPortfolio = async (req, res) => {
    const { id } = req.body

    let existing = await Users.findById(req.body.id).populate('portfolio_id')
    
    if(!existing.portfolio_id){
        let newPortfolio = { published: true }

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
        let portfolio = existing.portfolio_id
        if(!portfolio.published) portfolio['published'] = true
        else portfolio.published = true

        await Portfolio.findByIdAndUpdate(existing.portfolio_id, { ...portfolio, portfolio }, {new: true})
            .then(async () => {
                let user = await Users.findById(id).populate('portfolio_id')
                return res.status(200).json({
                    result: user.portfolio_id
                });
            })         
    }
}

exports.unpublishPortfolio = async (req, res) => {
    const { id } = req.body

    let existing = await Users.findById(req.body.id).populate('portfolio_id')
    
    if(!existing.portfolio_id){
        let newPortfolio = { published: false }

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
        let portfolio = existing.portfolio_id
        if(!portfolio.published) portfolio['published'] = false
        else portfolio.published = false

        await Portfolio.findByIdAndUpdate(existing.portfolio_id, { ...portfolio, portfolio }, {new: true})
            .then(async () => {
                let user = await Users.findById(id).populate('portfolio_id')
                return res.status(200).json({
                    result: user.portfolio_id
                });
            })         
    }
}

exports.getProject = async (req, res) => {
    
    const { username, project_name } = req.body

    let result = {}

    let user = await Users.findOne({username: username}).populate('portfolio_id')

    if(!user) return res.status(404).json({ variant: 'danger', message: "project not found" })

    if(user.portfolio_id && user.portfolio_id.projects.length > 0)
        user.portfolio_id.projects.some((item) => {
            if(item.project_name.toLowerCase() === project_name.split('_').join(" ").toLowerCase()){
                result = item
                return true
            }
        })
    
    if(Object.keys(result).length === 0) 
        return res.status(404).json({ variant: 'danger', message: "project not found" })

    res.status(200).json({ 
        result: result,
        published: user.portfolio_id.published
    })
}

exports.getPortfolioByUsername = async (req, res) => {
    const { username } = req.body
    await Users.findOne({username: username}).populate('portfolio_id')
        .then(user => res.status(200).json({ 
            result: user.portfolio_id,
            published: user.portfolio_id.published
        }))
        .catch(err => res.status(404).json({ variant: 'danger', message: err }))
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

function uploadSingleImage(base64, folder){
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
            parents: [folder]
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

function deleteSingleImage (delete_id, folder) {
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
                    parents: [folder]
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
                                icon_id.push(uploadSingleImage(icon, '1GdrQDlW5rkUREbsHZF71cuAp3wPLv-BT'))
                            })

                            Promise.all(icon_id)
                                .then(async (newImageID) => {
                                    removed_icons.forEach((item) => {
                                        icon_removed_id.push(deleteSingleImage(item, '1GdrQDlW5rkUREbsHZF71cuAp3wPLv-BT'))
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
                                icon_removed_id.push(deleteSingleImage(item, '1GdrQDlW5rkUREbsHZF71cuAp3wPLv-BT'))
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
                    icon_id.push(uploadSingleImage(icon, '1GdrQDlW5rkUREbsHZF71cuAp3wPLv-BT'))
                })

                Promise.all(icon_id)
                    .then(async (newImageID) => {
                        removed_icons.forEach((item) => {
                            icon_removed_id.push(deleteSingleImage(item, '1GdrQDlW5rkUREbsHZF71cuAp3wPLv-BT'))
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
                    icon_removed_id.push(deleteSingleImage(item, '1GdrQDlW5rkUREbsHZF71cuAp3wPLv-BT'))
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


function uploadImagesByNested(base64, index, sub_index, gallery_index){

    if(base64.includes('https://drive.google.com')) {
        return  gallery_index !== undefined ? 
            {
                image: base64,
                index: index,
                sub_index: sub_index,
                gallery_index: gallery_index
            }
            :
            {
                image: base64,
                index: index,
                sub_index: sub_index
            }
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
            parents: ['1kT3dkKXi21HKhGc7sMlcgU9N3rq86puq']
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
                    return gallery_index  !== undefined ? 
                        {
                            image: base64,
                            index: index,
                            sub_index: sub_index,
                            gallery_index: gallery_index
                        }
                        :
                        {
                            image: base64,
                            index: index,
                            sub_index: sub_index
                        }
                } else {
                    if (err) {
                        console.log(err)
                        reject(err);
                    } else {
                        console.log("FILE ADDED", file.data.id)
                        if(gallery_index !== undefined)
                            resolve({
                                image: `https://drive.google.com/uc?export=view&id=${file.data.id}`,
                                index: index,
                                sub_index: sub_index,
                                gallery_index: gallery_index
                            })
                        else 
                            resolve({
                                image: `https://drive.google.com/uc?export=view&id=${file.data.id}`,
                                index: index,
                                sub_index: sub_index,
                            });
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

exports.uploadServices = async (req, res) => {

    const { id, data, removeImage } = req.body
    let existing = await Users.findById(id).populate('portfolio_id')

    let icon_removed_id = []

    removeImage.forEach((item) => {
        icon_removed_id.push(deleteSingleImage(item, '1kT3dkKXi21HKhGc7sMlcgU9N3rq86puq'))
    })

    Promise.all(icon_removed_id)
        .then(async () => {
            let featured_arr = []
            data.forEach((item, i) => {
                item.type_of_service.forEach((data, x) => {
                    featured_arr.push(uploadImagesByNested(data.featured_image, i, x))
                })
            })
        
            Promise.all(featured_arr)
                .then(async (featured_result) => {
        
                    let gallery_arr = []
            
                    data.forEach((item, i) => {
                        item.type_of_service.forEach((data, x) => {
                            data.gallery.map((image, y) => {
                                gallery_arr.push(uploadImagesByNested(image, i, x, y))
                            })
                        })
                    })
        
                    Promise.all(gallery_arr)
                        .then(async (result) => {
        
                            featured_result.forEach((item) => {
                                data[item.index].type_of_service[item.sub_index].featured_image = item.image
                            })
        
                            result.forEach((item) => {
                                data[item.index].type_of_service[item.sub_index].gallery[item.gallery_index] = item.image
                            })
        
                            const services = data
        
                            try {
                                if(!existing.portfolio_id){
                                    await req.body.save().then(async (result) => {
                                        await Users.findByIdAndUpdate(id, {portfolio_id: result._id}, {new: true})
                                    });
                
                                    let user = await Users.findById(id).populate('portfolio_id')
                                    return res.status(200).json({
                                        variant: 'success',
                                        alert: "Services data successfully added!",
                                        result: user.portfolio_id
                                    });
                                }
                                else {
                                    await Portfolio.findByIdAndUpdate(existing.portfolio_id, {...services, services}, {new: true})
                                    .then(async (data) => {
                                        let user = await Users.findById(id).populate('portfolio_id')
                                        return res.status(200).json({
                                            variant: 'success',
                                            alert: "Services successfully updated!",
                                            result: user.portfolio_id
                                        });
                                    })
                                }
                            } catch (error) {
                                console.log(error)
                                return res.status(409).json({ 
                                    variant: 'danger',
                                    message: "409: there was a problem with the server."
                                });
                            }
        
                        })
                        .catch((e) => {
                            console.log(e)
                        });
                })
                .catch((e) => {
                    console.log(e)
                });
        })
        .catch((e) => {
            console.log(e)
        });
}

exports.addExperience = async (req, res) => {
    const { id, image_overlay, company_logo, year_start, year_end, position, company_location, remote_work, duties } = req.body

    jwtClient.authorize(async (err, tokens) => {

        let existing = await Users.findById(req.body.id).populate('portfolio_id')

        uploadSingleImage(image_overlay, '1rzx99eP0r2lUSZdOP0aQnEC3-ml0mCOw')
            .then((overlay_id) => {
                req.body.image_overlay = `https://drive.google.com/uc?export=view&id=${overlay_id}`

                uploadSingleImage(company_logo, '1UDgS6AsmxQQbIgkOZXEbflrTg2bHX9NB')
                    .then(async (logo_id) => {
                        req.body.company_logo = `https://drive.google.com/uc?export=view&id=${logo_id}`

                        const experience = req.body

                        const newPortfolio = new Portfolio({ user: id, experience })

                        try{
                            if(!existing.portfolio_id){
                                await newPortfolio.save().then(async (result) => {
                                    await Users.findByIdAndUpdate(id, {portfolio_id: result._id}, {new: true})
                                });
                    
                                let user = await Users.findById(id).populate('portfolio_id')
                                return res.status(200).json({
                                    variant: 'success',
                                    alert: "Experience data successfully added!",
                                    result: user.portfolio_id
                                });
                            }
                            else {             
                                await Portfolio.findByIdAndUpdate(existing.portfolio_id, 
                                    { $push: { experience: experience } },
                                    { new: true, useFindAndModify: false })
                                .then(async (data) => {
                                    let user = await Users.findById(id).populate('portfolio_id')
    
                                    return res.status(200).json({
                                        variant: 'success',
                                        alert: "Experience successfully updated!",
                                        result: user.portfolio_id
                                    });
                                })
                            }
                        }
                        catch(err){
                            console.log(err)
                        }
                    })
                    .catch((err) => {
                        return res.status(409).json({ 
                            variant: 'danger',
                            message: "500: Error uploading images."
                        });
                    })
            })
            .catch((err) => {
                return res.status(409).json({ 
                    variant: 'danger',
                    message: "500: Error uploading images."
                });
            })
    });
    return
}

exports.updateExperience = async (req, res) => {
    const { id, data, removeImage } = req.body

    let existing = await Users.findById(id).populate('portfolio_id')

    let removed_id = []

    removeImage.forEach((item) => {
        removed_id.push(deleteSingleImage(item, '1GdrQDlW5rkUREbsHZF71cuAp3wPLv-BT'))
    })

    Promise.all(removed_id)
        .then(async () => {

            const experience = data

            try {
                await Portfolio.findByIdAndUpdate(existing.portfolio_id, {...experience, experience}, {new: true})
                .then(async (data) => {
                    let user = await Users.findById(id).populate('portfolio_id')
                    return res.status(200).json({
                        variant: 'success',
                        alert: "Experience successfully updated!",
                        result: user.portfolio_id
                    });
                })
            } catch (error) {
                console.log(error)
                return res.status(409).json({ 
                    variant: 'danger',
                    message: "409: there was a problem with the server."
                });
            }

        })
        .catch((e) => {
            console.log(e)
        });
}

exports.addProject = async (req, res) => {
    const { id, image } = req.body

    let existing = await Users.findById(req.body.id).populate('portfolio_id')

    uploadSingleImage(image, '1QJSZ0tnMtUqE3f6EwaSbnAs1h7zjzk1J')
        .then(async (image_id) => {

            req.body.image = `https://drive.google.com/uc?export=view&id=${image_id}`

            const projects = req.body

            const newPortfolio = new Portfolio({ user: id, projects })

            try{
                if(!existing.portfolio_id){
                    await newPortfolio.save().then(async (result) => {
                        await Users.findByIdAndUpdate(id, {portfolio_id: result._id}, {new: true})
                    });
        
                    let user = await Users.findById(id).populate('portfolio_id')
                    return res.status(200).json({
                        variant: 'success',
                        alert: "Project data successfully added!",
                        result: user.portfolio_id
                    });
                }
                else {             
                    await Portfolio.findByIdAndUpdate(existing.portfolio_id, 
                        { $push: { projects: projects } },
                        { new: true, useFindAndModify: false })
                    .then(async () => {
                        let user = await Users.findById(id).populate('portfolio_id')

                        return res.status(200).json({
                            variant: 'success',
                            alert: "Project successfully updated!",
                            result: user.portfolio_id
                        });
                    })
                }
            }
            catch(err){
                console.log(err)
            }
        })
        .catch((err) => {
            return res.status(409).json({ 
                variant: 'danger',
                message: "500: Error uploading images."
            });
        })

}

function uploadImageByIndex(base64, index, folder){
    if(base64.includes('https://drive.google.com')) {
        console.log(base64)
        return {
            image: base64,
            index: index
        }
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
            parents: [folder]
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
                    return {
                        image: base64,
                        index: index
                    }
                } else {
                    if (err) {
                        console.log(err)
                        reject(err);
                    } else {
                        console.log("FILE ADDED", file.data.id)
                        resolve({
                            image: `https://drive.google.com/uc?export=view&id=${file.data.id}`,
                            index: index
                        });
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

exports.updateProject = async (req, res) => {
    const { data, id, removeImage } = req.body

    let existing = await Users.findById(id).populate('portfolio_id')

    let removed_id = []

    removeImage.forEach((item) => {
        removed_id.push(deleteSingleImage(item, '1QJSZ0tnMtUqE3f6EwaSbnAs1h7zjzk1J'))
    })

    Promise.all(removed_id)
        .then(async () => {
            let featured_arr = []

            data.forEach((item, i) => {
                featured_arr.push(uploadImageByIndex(item.image, i, '1QJSZ0tnMtUqE3f6EwaSbnAs1h7zjzk1J'))
            })

            Promise.all(featured_arr)
                .then(async (featured_result) => {
                    featured_result.forEach((item) => {
                        data[item.index].image = item.image
                    })

                    let projects = data

                    await Portfolio.findByIdAndUpdate(existing.portfolio_id, {...projects, projects}, {new: true})
                        .then(async () => {
                            let user = await Users.findById(id).populate('portfolio_id')
                            return res.status(200).json({
                                variant: 'success',
                                alert: "Project successfully updated!",
                                result: user.portfolio_id
                            });
                        })
                })
                .catch((e) => {
                    console.log(e)
                });
        })
        .catch((e) => {
            console.log(e)
        });
}

exports.deleteProject = async (req, res) => {
    const { data, id, removeImage } = req.body

    let existing = await Users.findById(id).populate('portfolio_id')

    let removed_id = []

    removeImage.forEach((item) => {
        removed_id.push(deleteSingleImage(item, '1QJSZ0tnMtUqE3f6EwaSbnAs1h7zjzk1J'))
    })

    Promise.all(removed_id)
        .then(async () => {
            
            let projects = data

            await Portfolio.findByIdAndUpdate(existing.portfolio_id, {...projects, projects}, {new: true})
                .then(async () => {
                    let user = await Users.findById(id).populate('portfolio_id')
                    return res.status(200).json({
                        variant: 'success',
                        alert: "Project successfully updated!",
                        result: user.portfolio_id
                    });
                })
        })
        .catch((e) => {
            console.log(e)
        });
}

function isEmail(text) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
}

exports.sendContactUs = async (req, res) => {
    const { name, email, message } = req.body

    let mailOptions = {
        from: 'zantei.automailer@gmail.com', // sender address
        to: 'jamezarviemaderas@gmail.com', // list of receivers
        subject: "Contact Us Form", // Subject line
        text: `
            Someone fill up your contact form. Here are the information
            Name: ${name}
            Email: ${email}
            Message: ${message}
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(409).json({ 
                mailStatus: 'There was a problem sending messages, Please try again'
            });
        } else {
            return res.status(200).json({
                mailStatus: 'Message has been sent successfully!'
            });
        }
    });

}

exports.sendEmail = async (req, res) => {
    const { name, email, sender_email, phone, subject, message } = req.body

    if(!isEmail(sender_email))
        return res.status(409).json({ 
            mailStatus: 'Invalid Email Address'
        });

    let reciever = ''
    if(email) reciever = email
    else reciever = 'razorscythe25@gmail.com'

    let mailOptions = {
        from: 'zantei.automailer@gmail.com', // sender address
        to: reciever, // list of receivers
        subject: subject[0], // Subject line
        text: `
            Someone fill up your form on your portfolio pages. Here are the information
            Name: ${name}
            Email: ${sender_email}
            Phone: ${phone ? phone : 'n/a'}
            Message: ${message}
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(409).json({ 
                mailStatus: 'There was a problem sending messages, Please try again'
            });
        } else {
            return res.status(200).json({
                mailStatus: 'Message has been sent successfully!'
            });
        }
    });

}

exports.sendTestEmail = async (req, res) => {
    const { email } = req.body

    if(!isEmail(email))
        return res.status(409).json({ 
            variant: 'danger',
            message: 'Error: Invalid email address.'
        });
    // send mail with defined transport object
    let mailOptions = {
        from: 'zantei.automailer@gmail.com', // sender address
        to: email, // list of receivers
        subject: 'Test Email', // Subject line
        text: 'This is a test email to see if the email successfully sent to the reciever' // plain text body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(409).json({ 
                variant: 'danger',
                message: 'Error: there was a problem with the email. Please try again.'
            });
        } else {
            return res.status(200).json({
                variant: 'success',
                alert: "Email sent successfully, please check your inbox",
            });
        }
    });
}

exports.uploadContacts = async (req, res) => {
    const { email, id, subject} = req.body

    let existing = await Users.findById(req.body.id).populate('portfolio_id')

    const contact = { email: email, subject: subject }

    const newPortfolio = new Portfolio({ user: id, contact })

    try {
        if(!existing.portfolio_id){
            await newPortfolio.save().then(async (result) => {
                await Users.findByIdAndUpdate(id, {portfolio_id: result._id}, {new: true})
            });

            let user = await Users.findById(id).populate('portfolio_id')
            return res.status(200).json({
                variant: 'success',
                alert: "Contact data successfully added!",
                result: user.portfolio_id
            });
        }
        else {

            await Portfolio.findByIdAndUpdate(existing.portfolio_id, { ...contact, contact }, {new: true})
            .then(async () => {
                let user = await Users.findById(id).populate('portfolio_id')
                return res.status(200).json({
                    variant: 'success',
                    alert: "Contact successfully updated!",
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