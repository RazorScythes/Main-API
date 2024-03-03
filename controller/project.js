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

    let projects = await Project.find({}).sort({ createdAt: -1 }).populate('user').populate('categories')

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

exports.getProjectsByCategories = async(req, res) => {
    const { id, category } = req.body

    let cat = await Category.findOne({shortcut: category})

    if(cat === null) {
        return res.status(404).json({ 
            message: "No available projects"
        })
    }
   
    let project = await Project.find({}).sort({ createdAt: -1 }).populate('user')

    let projects = project.filter(proj => cat._id.equals(proj.categories));

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
                result: collection,
                tags: countTags(projects)
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
                result: collection,
                tags: countTags(projects)
            })
        }
        else {
            res.status(404).json({ 
                message: "No available projects"
            })
        }
    }
}

exports.getProjectsBySearchKey = async (req, res) => {
    const { id, searchKey } = req.body

    let projects = await Project.find({}).sort({ createdAt: -1 }).populate('user')
    let collected_projects = []

    if(!searchKey)
        return res.status(404).json({ 
            message: "No Available Project"
        })

    projects.forEach((project) => {
        if(project.post_title.toLowerCase().includes(searchKey.toLowerCase()))
            collected_projects.push(project)
    })
  
    let deleteDuplicate = collected_projects.filter((obj, index, self) =>
        index === self.findIndex((o) => o._id.equals(obj._id))
    );

    if(id) {
        const user = await Users.findById(id)

        if(user.safe_content || user.safe_content === undefined)
            deleteDuplicate = deleteDuplicate.filter((item) => item.strict !== true)

        deleteDuplicate = deleteDuplicate.filter((item) => item.privacy !== true)

        if(deleteDuplicate.length > 0) {
            const collection = []
            deleteDuplicate.map(obj => {
                obj['user'] = {
                    username: obj.user.username,
                    avatar: obj.user.avatar
                }
                collection.push(obj);
            });
            
            res.status(200).json({ 
                result: collection,
                tags: countTags(deleteDuplicate)
            })
        }
        else {
            res.status(404).json({ 
                message: "No Available Project"
            })
        }
    }
    else {
        deleteDuplicate = deleteDuplicate.filter((item) => item.strict === false)
        deleteDuplicate = deleteDuplicate.filter((item) => item.privacy !== true)

        if(deleteDuplicate.length > 0) {
            const collection = []
            deleteDuplicate.map(obj => {
                obj['user'] = {
                    username: obj.user.username,
                    avatar: obj.user.avatar
                }
                collection.push(obj);
            });

            res.status(200).json({ 
                result: collection,
                tags: countTags(deleteDuplicate)
            })
        }
        else {
            res.status(404).json({ 
                message: "No Available Project"
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

function countTags(arr) {
    var tag_list = []
    arr.forEach((item) => {
        if(item.tags.length > 0) {
            item.tags.forEach((tag) => {
                tag_list.push(tag)
            })
        }
    })

    const counts = tag_list.reduce((acc, tag) => {
        if (acc[tag]) {
        acc[tag]++;
        } else {
        acc[tag] = 1;
        }
        return acc;
    }, {});
    
    const result = Object.entries(counts).map(([tag, count]) => ({ tag, count }));
    return result
}

exports.projectCountTags = async (req, res) => {
    const { id } = req.body

    var projects = await Project.find({}).sort({ createdAt: -1 }).populate('user')
    var tag_list = []

    if(id) {
        const user = await Users.findById(id)

        if(user.safe_content || user.safe_content === undefined)
            projects = projects.filter((item) => item.strict !== true)

        projects = projects.filter((item) => item.privacy !== true)

        if(projects.length > 0) {
            projects.forEach((item) => {
                if(item.tags.length > 0) {
                    item.tags.forEach((tag) => {
                        tag_list.push(tag)
                    })
                }
            })

            const counts = tag_list.reduce((acc, tag) => {
                if (acc[tag]) {
                acc[tag]++;
                } else {
                acc[tag] = 1;
                }
                return acc;
            }, {});
            
            const result = Object.entries(counts).map(([tag, count]) => ({ tag, count }));
            res.status(200).json({
                result: result
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
            projects.forEach((item) => {
                if(item.tags.length > 0) {
                    item.tags.forEach((tag) => {
                        tag_list.push(tag)
                    })
                }
            })

            const counts = tag_list.reduce((acc, tag) => {
                if (acc[tag]) {
                acc[tag]++;
                } else {
                acc[tag] = 1;
                }
                return acc;
            }, {});
            
            const result = Object.entries(counts).map(([tag, count]) => ({ tag, count }));

            res.status(200).json({
                result: result
            })
        }
        else {
            res.status(404).json({ 
                message: "No available projects"
            })
        }
    }
}

exports.getProjectByID = async (req, res) => {
    const { id, projectId } = req.body

    if(!projectId) return res.status(404).json({ variant: 'danger', message: "project id not found", notFound: true })

    try {
        let projects = await Project.find().populate('user')
        let index = projects.findIndex((obj) => obj['_id'].equals(projectId));
        let project =  projects.find((obj) => obj['_id'].equals(projectId));
        let next, prev;
        let user = null

        if(id) user = await Users.findById(id)

        if(!project) return res.status(404).json({ variant: 'danger', message: "project id not found", notFound: true })
        if(index !== projects.length - 1) next = projects[index+1]._id
        if(index !== 0) prev = projects[index-1]._id

        const result = {
            username: project.user.username,
            avatar: project.user.avatar,
            project, 
            next: next ? next : '',
            prev: prev ? prev : ''
        }
        result.project['user'] = {}

        if(user) {
            if(user.safe_content || user.safe_content === undefined) {
                if(project.strict) { res.status(409).json({ forbiden: 'strict'}) }
                else if(project.privacy) { res.status(409).json({ forbiden: 'private' }) }
                else { res.status(200).json({  result: result }) }
            }
            else {
                if(project.privacy) { res.status(409).json({ forbiden: 'private' }) }
                else { res.status(200).json({ result: result }) }
            }
        }
        else {
            if(project.strict) { res.status(409).json({ forbiden: 'strict'}) }
            else if(project.privacy) { res.status(409).json({ forbiden: 'private' }) }
            else { res.status(200).json({  result: result }) }
        }
    }
    catch(err) {
        console.log(err)
        return res.status(404).json({ variant: 'danger', message: 'invalid projectId', notFound: true })
    }
}

function getProjectCommentInfo(data) {
    return new Promise(async (resolve) => {
        const user = await Users.findById(data.user)
        const obj = {
            id: data.id,
            parent_id: data.parent_id,
            username: user.username,
            avatar: user.avatar,
            comments: data.comments,
            date: data.date
        }
        resolve(obj)
    });
}

exports.getProjectComments = async (req, res) => {
    const { projectId } = req.body

    if(!projectId) return res.status(404).json({ variant: 'danger', message: err })

    try {
        let project = await Project.findById(projectId).populate('user')

        if(!project) return res.status(404).json({ variant: 'danger', message: err })

        var collection = []
        project.comment.forEach((c) => {
            collection.push(getProjectCommentInfo(c))
        })
        Promise.all(collection)
        .then((comments_result) => {
            project.comment = comments_result
            let sorted = project.comment.sort(function(a, b) {
                var c = new Date(a.date);
                var d = new Date(b.date);
                return d-c;
            });

            res.status(200).json({ 
                comments: sorted
            })
        })
        .catch((e) => {
            console.log(e)
            res.status(409).json({ message: e.message });
        });
    }
    catch (err) {
        console.log(err)
        return res.status(404).json({ variant: 'danger', message: 'invalid videoId' })
    }
}

exports.uploadProjectComment = async (req, res) => {
    const { id, avatar, user, comment } = req.body

    let project = await Project.findById(id).populate('user')

    if(!project) return res.status(404).json({ variant: 'danger', message: err })

    const newComment = {
        id: uuid.v4(),
        parent_id: id,
        user: user,
        comments: comment,
        date: new Date()
    }

    project.comment.push(newComment)
   
    Project.findByIdAndUpdate(id, project, { new: true }).populate('user')
    .then((updated) => {
        var collection = []
        updated.comment.forEach((c) => {
            collection.push(getProjectCommentInfo(c))
        })
        Promise.all(collection)
        .then((comments_result) => {
            let sorted = comments_result.sort(function(a, b) {
                var c = new Date(a.date);
                var d = new Date(b.date);
                return d-c;
            });
            res.status(200).json({ 
                comments: sorted
            })
        })
        .catch((e) => {
            console.log(e)
            res.status(409).json({ message: e.message });
        });
    })
    .catch((err) => {
        return res.status(404).json({ variant: 'danger', message: err })
    })
}

exports.removeProjectComment = async (req, res) => {
    const { parent_id, comment_id } = req.body

    let project = await Project.findById(parent_id).populate('user')

    if(!project) return res.status(404).json({ variant: 'danger', message: err })

    const filtered = project.comment.filter(comments => comments.id !== comment_id)

    project.comment = filtered

    Project.findByIdAndUpdate(parent_id, project, { new: true }).populate('user')
    .then((updated) => {
        var collection = []
        updated.comment.forEach((c) => {
            collection.push(getProjectCommentInfo(c))
        })
        Promise.all(collection)
        .then((comments_result) => {
            let sorted = comments_result.sort(function(a, b) {
                var c = new Date(a.date);
                var d = new Date(b.date);
                return d-c;
            });
            res.status(200).json({ 
                comments: sorted
            })
        })
        .catch((e) => {
            console.log(e)
            res.status(409).json({ message: e.message });
        });
    })
    .catch((err) => {
        console.log(err)
        return res.status(404).json({ variant: 'danger', message: err })
    })
}

exports.getLatestProjects = async(req, res) => {
    const { id, projectId } = req.body

    let projects = await Project.find({}).sort({ createdAt: -1 }).populate('user').populate('categories')

    if(id) {
        const user = await Users.findById(id)

        if(user.safe_content || user.safe_content === undefined)
            projects = projects.filter((item) => item.strict !== true)

        projects = projects.filter((item) => item.privacy !== true)

        if(projects.length > 0) {
            const latestProjects = projects.slice(0, 8)
            const filterProjects = latestProjects.filter((project) => !project._id.equals(projectId))
            const collection = []
            filterProjects.map(obj => {
                let newObj = {
                    _id: obj._id,
                    featured_image: obj.featured_image,
                    post_title: obj.post_title,
                    likes: obj.likes,
                    createdAt: obj.createdAt,
                    category_shortcut: obj.categories.shortcut
                }
                collection.push(newObj);
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
            const latestProjects = projects.slice(0, 8)
            const filterProjects = latestProjects.filter((project) => !project._id.equals(projectId))
            const collection = []
            filterProjects.map(obj => {
                let newObj = {
                    _id: obj._id,
                    featured_image: obj.featured_image,
                    post_title: obj.post_title,
                    likes: obj.likes,
                    createdAt: obj.createdAt,
                    category_shortcut: obj.categories.shortcut
                }
                collection.push(newObj);
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