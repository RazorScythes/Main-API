const Users                 = require('../models/user.model')
const nodemailer            = require('nodemailer');
const uuid                  = require('uuid');
const path                  = require('path')
const bcrypt                = require('bcryptjs')
const moment                = require('moment');
const crypto                = require('crypto');
const { google }            = require('googleapis');
const { Readable }          = require('stream')

var transporter = null 
var jwtClient = null
var site_ = ''
// // Get the current time
// const currentTime = moment();

// // Create a copy of the current time
// const futureTime = moment();

// // Add 5 minutes to the future time
// futureTime.add(5, 'minutes');

// // Format the future time as desired
// const formattedTime = futureTime.format('YYYY-MM-DD HH:mm:ss');

// const givenTime = moment('2023-05-19 21:20:51');

// //givenTime.add(10, 'minutes');

// console.log('Current Time:', givenTime);
// console.log('Future Time:', formattedTime)

// // Compare current time with future time
// if (givenTime.isAfter(futureTime)) {
//   console.log('Current time has passed the future time.');
// } else {
//   console.log('Current time is before the future time.');
// }

function generateToken(length) {
    // Define characters to be used in the token
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    
    let token = '';
    
    // Generate a random token using the specified length
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, characters.length);
      token += characters.charAt(randomIndex);
    }
    
    return token;
}

if(process.env.PRODUCTION) {
    site_ = 'https://main-website-sage.vercel.app/account_verify'

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

    site_ = 'http://localhost:5173/account_verify'

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
        full_name: user.full_name,
        verified: user?.verification?.verified,
        safe_content: user?.safe_content
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
                        
                        let verify = existing.verification

                        if(email !== existing.email) {
                            verify = {
                                verified: false,
                                verification_token: '',
                                verification_time_to_send: ''
                            }
                        }

                        await Users.findByIdAndUpdate(existing._id, { avatar: image_id, email: email, full_name: full_name, verification: verify }, {new: true})
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
            else {
                let verify = existing.verification

                if(email !== existing.email) {
                    verify = {
                        verified: false,
                        verification_token: '',
                        verification_time_to_send: ''
                    }
                }

                await Users.findByIdAndUpdate(existing._id, { email: email, full_name: full_name, verification: verify }, {new: true})
                .then(async (user) => {
                    return res.status(200).json({
                        variant: 'success',
                        alert: "Profile successfully updated!",
                        result: user
                    });
                })
            }
        })
        .catch((e) => {
            console.log(e)
        });
}

exports.updatePassword = async (req, res) => {
    const { id, password } = req.body
    try {
        const user = await Users.findById(id)

        if (!user) 
            return res.status(404).json({
                message: 'User not found',
                variant: 'danger'
            })
        
        const passwordCompare = await bcrypt.compare(password.old, user.password)

        if(!passwordCompare) return res.status(404).json({ message: "Old password is incorrect", variant: 'danger' })

        const  hashedPassword = await bcrypt.hash(password.new, 12);

        Users.findByIdAndUpdate(id, { password: hashedPassword }, { new: true })
        .then((updated_user) => {
            return res.status(200).json({
                variant: 'success',
                alert: "Password successfully updated!",
                result: {
                    avatar: updated_user.avatar
                }
            });
        })
        .catch((err) => {
            console.log(err)
            return res.status(409).json({ 
                variant: 'danger',
                message: "409: there was a problem with the server."
            })
        })

    }
    catch (err) {
        console.log(err)
    }
}

exports.updateOptions = async (req, res) => {
    const { id, strict } = req.body
    try {
        const user = await Users.findById(id)

        if (!user) 
            return res.status(404).json({
                message: 'User not found',
                variant: 'danger'
            })
    
        Users.findByIdAndUpdate(id, { safe_content: strict }, { new: true })
        .then((updated_user) => {
            return res.status(200).json({
                variant: 'success',
                alert: "Options successfully updated!",
                result: {
                    avatar: updated_user.avatar,
                    email: updated_user.email,
                    full_name: updated_user.full_name,
                    verified: updated_user?.verification?.verified,
                    safe_content: updated_user?.safe_content
                }
            });
        })
        .catch((err) => {
            console.log(err)
            return res.status(409).json({ 
                variant: 'danger',
                message: "409: there was a problem with the server."
            })
        })

    }
    catch (err) {
        console.log(err)
    }
}

exports.sendVerificationEmail = async (req, res) => {
    const { id, email } = req.body

    if(!id || !email)
        return res.status(409).json({ 
            variant: 'danger',
            heading: "Failed to Send",
            paragraph: "Please check your email"
        })
    
    let user = await Users.findById(id)
    

    if(Object.keys(user.verification).length > 0) {
        const currentTime = moment();
        const user_verification_time = moment(user.verification.verification_time_to_send)

        if (user_verification_time.isAfter(currentTime)) {
            return res.status(409).json({ 
                variant: 'danger',
                heading: "Already Sent",
                paragraph: "You can send again after 5 mins"
            })
        }
    }

    const futureTime = moment();
    futureTime.add(5, 'minutes');
    const formattedTime = futureTime.format('YYYY-MM-DD HH:mm:ss');

    const verification_obj = {
        verified: false,
        verification_token: generateToken(30),
        verification_time_to_send: formattedTime
    }

    user.verification = verification_obj
    
    let mailOptions = {
        from: 'zantei.automailer@gmail.com', // sender address
        to: email, // list of receivers
        subject: "Confirm Verification", // Subject line
        text: `
            Please confirm your email verification by clicking this link:
            <a href="${site_}?token=${user.verification.verification_token}">Click Here</a>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(409).json({ 
                variant: 'danger',
                heading: "Failed to Send",
                paragraph: "Please check your email"
            })
        } else {
            Users.findByIdAndUpdate(id, user, { new: true })
            .then(() => {   
                return res.status(200).json({ 
                    variant: 'success',
                    heading: "Verification Email Sent",
                    paragraph: "Please check your email"
                })
            })
            .catch(() => {
                return res.status(409).json({ 
                    variant: 'danger',
                    heading: "Failed to Update",
                    paragraph: "User update failed."
                })
            })
        }
    });
}

exports.verifyEmail = async (req, res) => {
    const { token } = req.body

    const users = await Users.find({})

    let token_found = false
    let token_expired = false
    let verified = false
    let user_data = null

    users.some((user) => {
        if(Object.keys(user.verification).length > 0) {
            if(user.verification.verification_token === token) {
                if(user.verification.verified) {
                    verified = true
                    return true
                }

                const currentTime = moment();
                const user_verification_time = moment(user.verification.verification_time_to_send)
               
                if (currentTime.isAfter(user_verification_time)) {
                    token_expired = true
                }
                else {
                    user_data = user
                    token_found = true
                }
                return true
            }
        }
    })

    if(verified) {
        return res.status(200).json({ 
            status: 'verified',
        })
    }
    else if(token_expired) {
        return res.status(409).json({ 
            status: 'expired',
        })
    }
    else if(token_found) {
        user_data.verification.verified = true 

        await Users.findByIdAndUpdate(user_data._id, user_data, { new: true })

        return res.status(200).json({ 
            status: 'activated',
        })
    }
    else {
        return res.status(409).json({ 
            status: 'notFound',
        })
    }
}