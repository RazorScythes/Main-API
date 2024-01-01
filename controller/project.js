const Project                   = require('../models/projects.model')
const Category                  = require('../models/category.model')
const Users                     = require('../models/user.model')
const mongoose                  = require('mongoose');
const path                      = require('path')
const uuid                      = require('uuid');
const nodemailer                = require('nodemailer');

const { google }                = require('googleapis');
const { Readable }              = require('stream')

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

function convertSizeToReadable(sizeInBytes) {
    const units = ['bytes', 'KB', 'MB'];  //'GB'
    let convertedSize = sizeInBytes;
    let unitIndex = 0;
  
    while (convertedSize >= 1024 && unitIndex < units.length - 1) {
      convertedSize /= 1024;
      unitIndex++;
    }
    
    return `${convertedSize.toFixed(2)} ${units[unitIndex]}`
}

function generateRandomID(length = 20) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }
  
    return result;
}

function uploadSingleImage(base64, folder){
    if(base64.includes('https://drive.google.com')) {
        // console.log(base64)
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

exports.getCategory = async(req, res) => {
    var array = []
    const categories = await Category.find({type: 'projects'})
    const projects = await Project.find({})

    categories.forEach((category) => {
        const lookup = projects.filter(project => category._id.equals(project.categories));
        console.log(lookup)
        array.push({
            icon: category.icon,
            category: category.category,
            shortcut: category.shortcut,
            count: lookup.length
        })
    })

    res.status(200).json({ 
        result: array
    })
}

exports.getAdminCategory = async(req, res) => {
    const category = await Category.find({type: 'projects'})

    if(category.length > 0) {
        res.status(200).json({ 
            result: category
        })
    }
    else {
        res.status(404).json({ 
            message: "No available category"
        })
    }
}

exports.getProjects = async(req, res) => {
    const { id } = req.body

    let projects = await Project.find({}).sort({ createdAt: -1 }).populate('user')

    if(id) {
        const user = await Users.findById(id)

        if(user.safe_content || user.safe_content === undefined)
            projects = projects.filter((item) => item.strict !== true)

        projects = projects.filter((item) => item.privacy !== true)

        if(projects.length > 0) {
            const collection = []
            projects.map(obj => {
                obj['user'] = {
                    username: obj.user.username,
                    avatar: obj.user.avatar
                }
                collection.push(obj);
            });

            res.status(200).json({ 
                result: collection
            })
        }
        else {
            res.status(404).json({ 
                message: "No available projects"
            })
        }
    }
    else {
        projects = projects.filter((item) => item.strict === false)
        projects = projects.filter((item) => item.privacy !== true)

        if(projects.length > 0) {
            const collection = []
            projects.map(obj => {
                obj['user'] = {
                    username: obj.user.username,
                    avatar: obj.user.avatar
                }
                collection.push(obj);
            });

            res.status(200).json({ 
                result: collection
            })
        }
        else {
            res.status(404).json({ 
                message: "No available projects"
            })
        }
    }
}

exports.getUserProject = async (req, res) => {
    const { id } = req.body

    if(!id) return res.status(404).json({ 
        variant: 'danger',
        message: "Error 404: User not found."
    });

    const user_project = await Project.find({ user: id }).sort({ createdAt: -1 })

    if(user_project.length > 0) {
        res.status(200).json({ 
            result: user_project
        });
    }
}

exports.uploadProject = async (req, res) => {
    const { id, data } = req.body

    if(!id) return res.status(404).json({ 
                variant: 'danger',
                message: "Error 404: User not found."
            });
            
    uploadSingleImage(data.featured_image, '1d0mxLywCkV6nVgXcu12PxYTTq_aXoQcF')
    .then(async (image_id) => {
        const newProject = new Project({ user: id, ...data, featured_image: `https://drive.google.com/uc?export=view&id=${image_id}`})

        await newProject.save()
        .then(async () => {
            let projects = await Project.find({ user: id }).sort({ createdAt: -1 })

            res.status(200).json({ 
                result: projects,
                variant: 'success',
                message: "Project Uploaded Successfully"
            });
        })
        .catch((err) => {
            console.log(err)
            return res.status(404).json({ 
                variant: 'danger',
                message: "Error Uploading Project"
            });
        });
    })
}

exports.editUserProject = async (req, res) => {
    const { id, data } = req.body

    if(!data || !id) return res.status(404).json({ variant: 'danger', message: "Project not found" })

    if(data.featured_image.includes("data:image")) {
        const singleProject = await Project.findById(data._id)
        deleteSingleImage(singleProject.featured_image, '1d0mxLywCkV6nVgXcu12PxYTTq_aXoQcF')
        .then(async () => {
            uploadSingleImage(data.featured_image, '1d0mxLywCkV6nVgXcu12PxYTTq_aXoQcF')
            .then(async (image_id) => {
                Project.findByIdAndUpdate(data._id, {...data, featured_image: `https://drive.google.com/uc?export=view&id=${image_id}`}, { new: true }).populate('user')
                .then(async (result) => {
                    try {
                        let projects = await Project.find({ user: id }).sort({ createdAt: -1 })
                        res.status(200).json({ 
                            variant: 'success',
                            message: `Project (${result.post_title}) successfully updated`,
                            result: projects,
                        });
                    }
                    catch(err) {
                        console.log(err)
                        return res.status(404).json({ 
                            variant: 'danger',
                            message: "Failed to fetch project"
                        });
                    }
                })
                .catch((err) => {
                    return res.status(404).json({ variant: 'danger', message: err })
                })
            })
            .catch(() => res.status(404).json({ variant: 'danger', message: "Error uploading image." }))
        })
        .catch(() => res.status(404).json({ variant: 'danger', message: "Error deleting previous image." }))
    }
    else {
        Project.findByIdAndUpdate(data._id, data, { new: true }).populate('user')
                .then(async (result) => {
                    try {
                        let projects = await Project.find({ user: id }).sort({ createdAt: -1 })
                        res.status(200).json({ 
                            variant: 'success',
                            message: `Project (${result.post_title}) successfully updated`,
                            result: projects,
                        });
                    }
                    catch(err) {
                        console.log(err)
                        return res.status(404).json({ 
                            variant: 'danger',
                            message: "Failed to fetch project"
                        });
                    }
                })
                .catch((err) => {
                    return res.status(404).json({ variant: 'danger', message: err })
                })
    }
}

exports.removeUserProject = async (req, res) => {
    const { id, project_id } = req.body
 
    if(!id) return res.status(404).json({ variant: 'danger', message: "User not found" })
    
    const singleProject = await Project.findById(project_id)
    deleteSingleImage(singleProject.featured_image, '1d0mxLywCkV6nVgXcu12PxYTTq_aXoQcF')
    .then(async () => {
        Project.findByIdAndDelete(project_id)
        .then(async () => {
            try {
                let projects = await Project.find({ user: id }).sort({ createdAt: -1 })

                res.status(200).json({ 
                    result: projects,
                });
            }
            catch(err) {
                console.log(err)
                return res.status(404).json({ 
                    variant: 'danger',
                    message: "Failed to fetch projects"
                });
            }
        })
        .catch((err) => {
            return res.status(404).json({ variant: 'danger', message: err })
        })
    })
    .catch(() => res.status(404).json({ variant: 'danger', message: "Error deleting previous image." }))
}