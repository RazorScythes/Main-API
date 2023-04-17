const Users                 = require('../models/user.model')
const nodemailer            = require('nodemailer');
const uuid                  = require('uuid');
const path                  = require('path')
const { google }            = require('googleapis');
const { Readable }          = require('stream')

var transporter = null 
var jwtClient = null

if(process.env.PRODUCTION) {
    jwtClient = new google.auth.JWT(
        process.env.CLIENT_EMAIL,
        null,
        process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
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
        process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
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

exports.getProfile = async (req, res) => {
    const { id } = req.body

    const user = await Users.findById(id)

    if(!user) return res.status(404).json({ variant: 'danger', message: "user not found" })

    const profile = {
        avatar: user.avatar,
        email: user.email,
        full_name: user.full_name
    }

    res.status(200).json({ 
        result: profile,
        published: user.portfolio_id.published
    })
}

exports.updateProfile = async (req, res) => {
    const { id, image, full_name, email, removeImage } = req.body

    let existing = await Users.findById(id)

    let removed_id = []

    removeImage.forEach((item) => {
        removed_id.push(deleteSingleImage(item, '1vBJDG4bN0k_Lvnyo3qVVLPusSJdW0_Uu'))
    })

    Promise.all(removed_id)
        .then(async () => {
            if(image && !image.includes('https://drive.google.com'))
                uploadSingleImage(image, '1vBJDG4bN0k_Lvnyo3qVVLPusSJdW0_Uu')
                    .then(async (avatar_id) => {

                        let image_id = `https://drive.google.com/uc?export=view&id=${avatar_id}`

                        await Users.findByIdAndUpdate(existing._id, { avatar: image_id, email: email, full_name: full_name }, {new: true})
                            .then(async (user) => {
                                return res.status(200).json({
                                    variant: 'success',
                                    alert: "Profile successfully updated!",
                                    result: user
                                });
                            })
                    })
                    .catch((e) => {
                        console.log(e)
                    });
            else 
                await Users.findByIdAndUpdate(existing._id, { email: email, full_name: full_name }, {new: true})
                .then(async (user) => {
                    return res.status(200).json({
                        variant: 'success',
                        alert: "Profile successfully updated!",
                        result: user
                    });
                })
        })
        .catch((e) => {
            console.log(e)
        });
}