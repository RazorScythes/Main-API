const Video                 = require('../models/video.model')
const Game                  = require('../models/games.model')
const Users                 = require('../models/user.model')
const Blog                  = require('../models/blogs.model')
const ActivityLogs          = require('../models/activityLogs.model')
const mongoose              = require('mongoose');
const path                  = require('path')
const uuid                  = require('uuid');
const nodemailer            = require('nodemailer');
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

exports.logsActivity = async (req, res) => {
    const { data } = req.body

    try {
        const activity_logs = new ActivityLogs(data)
        await activity_logs.save()

        res.status(200).json({ 
            message: 'logs created'
        });
    }
    catch(err) {
        console.log(err)
        return res.status(404).json({ 
            variant: 'danger',
            message: "Failed to log data"
        });
    }
}

exports.getUserVideo = async (req, res) => {
    const { id } = req.body

    if(!id) return res.status(404).json({ 
        variant: 'danger',
        message: "Error 404: User not found."
    });

    const user_video = await Video.find({ user: id }).sort({ createdAt: -1 })

    if(user_video.length > 0) {
        res.status(200).json({ 
            result: user_video
        });
    }
    // else {
    //     return res.status(404).json({ 
    //         variant: 'danger',
    //         message: "Error Fetching Videos"
    //     });
    // }
}

exports.getUserGame = async (req, res) => {
    const { id } = req.body

    if(!id) return res.status(404).json({ 
        variant: 'danger',
        message: "Error 404: User not found."
    });

    const user_game = await Game.find({ user: id }).sort({ createdAt: -1 })

    if(user_game.length > 0) {
        res.status(200).json({ 
            result: user_game
        });
    }
    // else {
    //     return res.status(404).json({ 
    //         variant: 'danger',
    //         message: "Error Fetching Videos"
    //     });
    // }
    
}

exports.getUserBlog = async (req, res) => {
    const { id } = req.body

    if(!id) return res.status(404).json({ 
        variant: 'danger',
        message: "Error 404: User not found."
    });

    const user_blog = await Blog.find({ user: id }).sort({ createdAt: -1 })

    if(user_blog.length > 0) {
        res.status(200).json({ 
            result: user_blog
        });
    }
    // else {
    //     return res.status(404).json({ 
    //         variant: 'danger',
    //         message: "Error Fetching Videos"
    //     });
    // }
    
}

exports.uploadVideo = async (req, res) => {
    const { id, data, size, isbulk } = req.body

    var find_duplication = await Video.find({ link: data.link })

    if(!id) return res.status(404).json({ 
                variant: 'danger',
                message: "Error 404: User not found."
            });
    
    if(find_duplication.length === 0) {
        const newVideo = new Video({ user: id, ...data, file_size: size ? convertSizeToReadable(size) : 0 })

        await newVideo.save()
        .then(async (response) => {
            if(!isbulk) {
                const activity_logs = new ActivityLogs({ user: id, id: response._id, type: 'video', method: 'POST', message: 'Uploaded single video' })
                await activity_logs.save()
            }

            let video = await Video.find({ user: id }).sort({ createdAt: -1 })
    
            res.status(200).json({ 
                result: video,
                variant: 'success',
                message: "Video Uploaded Successfully"
            });
        })
        .catch((err) => {
            console.log(err)
            return res.status(404).json({ 
                variant: 'danger',
                message: "Error Uploading Videos"
            });
        });
    }
    else {
        let video = await Video.find({ user: id }).sort({ createdAt: -1 })
    
        res.status(404).json({ 
            result: video,
            variant: 'danger',
            message: "Video already uploaded"
        });
    }
}

exports.uploadGame = async (req, res) => {
    const { id, data } = req.body
    delete data['_id'];

    if(!id) return res.status(404).json({ 
                variant: 'danger',
                message: "Error 404: User not found."
            });

    const newGame = new Game({ user: id, ...data })

    await newGame.save()
    .then(async (response) => {
        const activity_logs = new ActivityLogs({ user: id, id: response._id, type: 'game', method: 'POST', message: 'Uploaded a game' })
        await activity_logs.save()

        let games = await Game.find({ user: id }).sort({ createdAt: -1 })

        res.status(200).json({ 
            result: games,
            variant: 'success',
            message: "Game Uploaded Successfully"
        });
    })
    .catch((err) => {
        console.log(err)
        return res.status(404).json({ 
            variant: 'danger',
            message: "Error Uploading Game"
        });
    });
}

exports.changeStrictById = async (req, res) => {
    const { id, strict } = req.body

    Video.findByIdAndUpdate(id, { strict: strict }, { new: true })
    .then((result) => {
        res.status(200).json({ 
            result: result
        });
    })
    .catch(() => {
        return res.status(404).json({ 
            variant: 'danger',
            message: "Error Updating Videos"
        });
    });
}

exports.changeDownloadById = async (req, res) => {
    const { id, downloadable } = req.body
    
    Video.findByIdAndUpdate(id, { downloadable: downloadable }, { new: true })
    .then((result) => {
        res.status(200).json({ 
            result: result
        });
    })
    .catch((err) => {
        console.log(err)
        return res.status(404).json({ 
            variant: 'danger',
            message: "Error Updating Videos"
        });
    });
}

exports.changePrivacyById = async (req, res) => {
    const { id, privacy } = req.body

    var new_access_key = generateRandomID()

    Video.findByIdAndUpdate(id, { privacy: privacy, access_key: new_access_key }, { new: true })
    .then((result) => {
        res.status(200).json({ 
            result: result
        });
    })
    .catch(() => {
        return res.status(404).json({ 
            variant: 'danger',
            message: "Error Updating Videos"
        });
    });
}

exports.changeBlogStrictById = async (req, res) => {
    const { id, strict } = req.body

    Blog.findByIdAndUpdate(id, { strict: strict }, { new: true })
    .then((result) => {
        res.status(200).json({ 
            result: result
        });
    })
    .catch(() => {
        return res.status(404).json({ 
            variant: 'danger',
            message: "Error Updating Blog"
        });
    });
}

exports.changeBlogPrivacyById = async (req, res) => {
    const { id, privacy } = req.body

    Blog.findByIdAndUpdate(id, { privacy: privacy }, { new: true })
    .then((result) => {
        res.status(200).json({ 
            result: result
        });
    })
    .catch(() => {
        return res.status(404).json({ 
            variant: 'danger',
            message: "Error Updating Blog"
        });
    });
}

exports.editVideo = async (req, res) => {
    const { id, data } = req.body
    if(!data || !id) return res.status(404).json({ variant: 'danger', message: "Video not found" })

    Video.findByIdAndUpdate(data._id, data, { new: true }).populate('user')
    .then(async (result) => {
        try {
            const activity_logs = new ActivityLogs({ user: id, id: data._id, type: 'video', method: 'PATCH', message: 'Updated video' })
            await activity_logs.save()

            let videos = await Video.find({ user: id }).sort({ createdAt: -1 })
            res.status(200).json({ 
                variant: 'success',
                message: `Video (${result.title}) successfully updated`,
                result: videos,
            });
        }
        catch(err) {
            console.log(err)
            return res.status(404).json({ 
                variant: 'danger',
                message: "Failed to fetch videos"
            });
        }
    })
    .catch((err) => {
        return res.status(404).json({ variant: 'danger', message: err })
    })
}

exports.editGame = async (req, res) => {
    const { id, data } = req.body
    if(!data || !id) return res.status(404).json({ variant: 'danger', message: "Game not found" })

    Game.findByIdAndUpdate(data._id, data, { new: true }).populate('user')
    .then(async (result) => {
        try {
            const activity_logs = new ActivityLogs({ user: id, id: data._id, type: 'game', method: 'PATCH', message: 'Updated game' })
            await activity_logs.save()

            let games = await Game.find({ user: id }).sort({ createdAt: -1 })
            res.status(200).json({ 
                variant: 'success',
                message: `Game (${result.title}) successfully updated`,
                result: games,
            });
        }
        catch(err) {
            console.log(err)
            return res.status(404).json({ 
                variant: 'danger',
                message: "Failed to fetch videos"
            });
        }
    })
    .catch((err) => {
        return res.status(404).json({ variant: 'danger', message: err })
    })
}

exports.removeVideo = async (req, res) => {
    const { id, video_id } = req.body
 
    if(!id) return res.status(404).json({ variant: 'danger', message: "User not found" })

    Video.findByIdAndDelete(video_id)
    .then(async () => {
        try {
            let videos = await Video.find({ user: id }).sort({ createdAt: -1 })

            const activity_logs = new ActivityLogs({ user: id, id: video_id, type: 'video', method: 'DELETE', message: 'User deleted video' })
            await activity_logs.save()

            res.status(200).json({ 
                result: videos,
            });
        }
        catch(err) {
            console.log(err)
            return res.status(404).json({ 
                variant: 'danger',
                message: "Failed to fetch videos"
            });
        }
    })
    .catch((err) => {
        return res.status(404).json({ variant: 'danger', message: err })
    })
}

exports.bulkRemoveVideo = async (req, res) => {
    const { id, videos_id } = req.body
 
    if(!id) return res.status(404).json({ variant: 'danger', message: "User not found" })
    
    const objectIdsToDelete = videos_id.map(id => new mongoose.Types.ObjectId(id));

    Video.deleteMany({ _id: { $in: objectIdsToDelete } })
    .then(async (result) => {
        try {
            const activity_logs = new ActivityLogs({ user: id, id: 'bulk', type: 'video', method: 'DELETE', message: `Deleted ${videos_id.length} videos` })
            await activity_logs.save()

            let videos = await Video.find({ user: id }).sort({ createdAt: -1 })

            res.status(200).json({ 
                result: videos,
            });
        }
        catch(err) {
            console.log(err)
            return res.status(404).json({ 
                variant: 'danger',
                message: "Failed to fetch videos"
            });
        }
    })
    .catch((err) => {
        console.log(err)
        return res.status(404).json({ variant: 'danger', message: err })
    })
}

exports.removeGame = async (req, res) => {
    const { id, game_id } = req.body
 
    if(!id) return res.status(404).json({ variant: 'danger', message: "User not found" })
    
    Game.findByIdAndDelete(game_id)
    .then(async () => {
        try {
            const activity_logs = new ActivityLogs({ user: id, id: game_id, type: 'game', method: 'DELETE', message: 'User deleted game' })
            await activity_logs.save()

            let games = await Game.find({ user: id }).sort({ createdAt: -1 })

            res.status(200).json({ 
                result: games,
            });
        }
        catch(err) {
            console.log(err)
            return res.status(404).json({ 
                variant: 'danger',
                message: "Failed to fetch videos"
            });
        }
    })
    .catch((err) => {
        return res.status(404).json({ variant: 'danger', message: err })
    })
}

exports.changeGameStrictById = async (req, res) => {
    const { id, strict } = req.body

    Game.findByIdAndUpdate(id, { strict: strict }, { new: true })
    .then((result) => {
        res.status(200).json({ 
            result: result
        });
    })
    .catch(() => {
        return res.status(404).json({ 
            variant: 'danger',
            message: "Error Updating Game"
        });
    });
}

exports.changeGamePrivacyById = async (req, res) => {
    const { id, privacy } = req.body

    Game.findByIdAndUpdate(id, { privacy: privacy }, { new: true })
    .then((result) => {
        res.status(200).json({ 
            result: result
        });
    })
    .catch(() => {
        return res.status(404).json({ 
            variant: 'danger',
            message: "Error Updating Game"
        });
    });
}

exports.bulkRemoveGame = async (req, res) => {
    const { id, game_id } = req.body
 
    if(!id) return res.status(404).json({ variant: 'danger', message: "User not found" })
    
    const objectIdsToDelete = game_id.map(id => new mongoose.Types.ObjectId(id));

    Game.deleteMany({ _id: { $in: objectIdsToDelete } })
    .then(async (result) => {
        try {
            const activity_logs = new ActivityLogs({ user: id, id: 'bulk', type: 'game', method: 'DELETE', message: `Deleted ${game_id.length} games` })
            await activity_logs.save()

            let games = await Game.find({ user: id }).sort({ createdAt: -1 })

            res.status(200).json({ 
                result: games,
            });
        }
        catch(err) {
            console.log(err)
            return res.status(404).json({ 
                variant: 'danger',
                message: "Failed to fetch videos"
            });
        }
    })
    .catch((err) => {
        console.log(err)
        return res.status(404).json({ variant: 'danger', message: err })
    })
}

exports.updateVideoProperties = async (req, res) => {
    const { file_id, size, alternateLink, downloadUrl, embedLink, fileExtension, webContentLink, thumbnailLink, duration } = req.body
    
    try {
        const regex = new RegExp(file_id, 'i'); 

        const foundDocuments = await Video.find({ link: regex });
        
        if(foundDocuments.length > 0) {
            const updateVideo = await Video.findByIdAndUpdate(foundDocuments[0]._id, { 
                file_size: convertSizeToReadable(size),
                alternateLink: alternateLink,
                downloadUrl: downloadUrl,
                embedLink: embedLink,
                fileExtension: fileExtension,
                webContentLink: webContentLink,
                thumbnailLink: thumbnailLink,
                duration: duration
            }, { new: true })
            return res.status(200).json({ 
                variant: 'success',
                message: "Video Uploaded Successfully"
            });
        }
        else {
            return res.status(404).json({ 
                variant: 'danger',
                message: "Error Uploading Videos"
            });
        }
      } catch (error) {
        console.error('Error searching documents:', error);
        return res.status(404).json({ 
            variant: 'danger',
            message: "Error Uploading Videos"
        });
      }
}

exports.uploadBlog = async (req, res) => {
    const { id, data } = req.body

    if(!id) return res.status(404).json({ 
                variant: 'danger',
                message: "Error 404: User not found."
            });
            
    uploadSingleImage(data.featured_image, '17h4yR0kVlEYNMcnPKYFJQoZiPuJkN7Ts')
    .then(async (image_id) => {
        const newBlog = new Blog({ user: id, ...data, featured_image: `https://drive.google.com/uc?export=view&id=${image_id}`})

        await newBlog.save()
        .then(async (response) => {
            const activity_logs = new ActivityLogs({ user: id, id: response._id, type: 'blog', method: 'POST', message: 'Uploaded a blog' })
            await activity_logs.save()

            let blogs = await Blog.find({ user: id }).sort({ createdAt: -1 })

            res.status(200).json({ 
                result: blogs,
                variant: 'success',
                message: "Blog Uploaded Successfully"
            });
        })
        .catch((err) => {
            console.log(err)
            return res.status(404).json({ 
                variant: 'danger',
                message: "Error Uploading Blog"
            });
        });
    })
}

exports.editBlog = async (req, res) => {
    const { id, data } = req.body

    if(!data || !id) return res.status(404).json({ variant: 'danger', message: "Blog not found" })

    if(data.featured_image.includes("data:image")) {
        const singleBlog = await Blog.findById(data._id)
        deleteSingleImage(singleBlog.featured_image, '17h4yR0kVlEYNMcnPKYFJQoZiPuJkN7Ts')
        .then(async () => {
            uploadSingleImage(data.featured_image, '17h4yR0kVlEYNMcnPKYFJQoZiPuJkN7Ts')
            .then(async (image_id) => {
                Blog.findByIdAndUpdate(data._id, {...data, featured_image: `https://drive.google.com/uc?export=view&id=${image_id}`}, { new: true }).populate('user')
                .then(async (result) => {
                    try {
                        const activity_logs = new ActivityLogs({ user: id, id: data._id, type: 'blog', method: 'PATCH', message: 'Updated blog' })
                        await activity_logs.save()

                        let blogs = await Blog.find({ user: id }).sort({ createdAt: -1 })
                        res.status(200).json({ 
                            variant: 'success',
                            message: `Blog (${result.post_title}) successfully updated`,
                            result: blogs,
                        });
                    }
                    catch(err) {
                        console.log(err)
                        return res.status(404).json({ 
                            variant: 'danger',
                            message: "Failed to fetch blogs"
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
        Blog.findByIdAndUpdate(data._id, data, { new: true }).populate('user')
                .then(async (result) => {
                    try {
                        const activity_logs = new ActivityLogs({ user: id, id: data._id, type: 'blog', method: 'PATCH', message: 'Updated blog' })
                        await activity_logs.save()

                        let blogs = await Blog.find({ user: id }).sort({ createdAt: -1 })
                        res.status(200).json({ 
                            variant: 'success',
                            message: `Blog (${result.post_title}) successfully updated`,
                            result: blogs,
                        });
                    }
                    catch(err) {
                        console.log(err)
                        return res.status(404).json({ 
                            variant: 'danger',
                            message: "Failed to fetch blogs"
                        });
                    }
                })
                .catch((err) => {
                    return res.status(404).json({ variant: 'danger', message: err })
                })
    }
}

exports.removeBlog = async (req, res) => {
    const { id, blog_id } = req.body
 
    if(!id) return res.status(404).json({ variant: 'danger', message: "User not found" })
    
    Blog.findByIdAndDelete(blog_id)
    .then(async () => {
        try {
            const activity_logs = new ActivityLogs({ user: id, id: blog_id, type: 'blog', method: 'DELETE', message: 'User deleted blog' })
            await activity_logs.save()

            let blogs = await Blog.find({ user: id }).sort({ createdAt: -1 })

            res.status(200).json({ 
                result: blogs,
            });
        }
        catch(err) {
            console.log(err)
            return res.status(404).json({ 
                variant: 'danger',
                message: "Failed to fetch blogs"
            });
        }
    })
    .catch((err) => {
        return res.status(404).json({ variant: 'danger', message: err })
    })
}

exports.bulkRemoveBlog = async (req, res) => {
    const { id, blog_id } = req.body
 
    if(!id) return res.status(404).json({ variant: 'danger', message: "User not found" })
    
    const objectIdsToDelete = blog_id.map(id => new mongoose.Types.ObjectId(id));

    Blog.deleteMany({ _id: { $in: objectIdsToDelete } })
    .then(async (result) => {
        try {
            const activity_logs = new ActivityLogs({ user: id, id: 'bulk', type: 'blog', method: 'DELETE', message: `Deleted ${blog_id.length} blogs` })
            await activity_logs.save()

            let blogs = await Blog.find({ user: id }).sort({ createdAt: -1 })

            res.status(200).json({ 
                result: blogs,
            });
        }
        catch(err) {
            console.log(err)
            return res.status(404).json({ 
                variant: 'danger',
                message: "Failed to fetch blogs"
            });
        }
    })
    .catch((err) => {
        console.log(err)
        return res.status(404).json({ variant: 'danger', message: err })
    })
}