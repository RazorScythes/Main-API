const Video               = require('../models/video.model')
const Game                = require('../models/games.model')
const Users               = require('../models/user.model')
const mongoose            = require('mongoose');

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

exports.uploadVideo = async (req, res) => {
    const { id, data } = req.body

    if(!id) return res.status(404).json({ 
                variant: 'danger',
                message: "Error 404: User not found."
            });

    const newVideo = new Video({ user: id, ...data })

    await newVideo.save()
    .then(async () => {
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

exports.uploadGame = async (req, res) => {
    const { id, data } = req.body

    if(!id) return res.status(404).json({ 
                variant: 'danger',
                message: "Error 404: User not found."
            });

    const newGame = new Game({ user: id, ...data })

    await newGame.save()
    .then(async () => {
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

    Video.findByIdAndUpdate(id, { privacy: privacy }, { new: true })
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

exports.editVideo = async (req, res) => {
    const { id, data } = req.body
    if(!data || !id) return res.status(404).json({ variant: 'danger', message: "Video not found" })

    Video.findByIdAndUpdate(data._id, data, { new: true }).populate('user')
    .then(async (result) => {
        try {
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

exports.updateVideoProperties = async (req, res) => {
    const { file_id, size } = req.body
    
    try {
        const regex = new RegExp(file_id, 'i'); 

        const foundDocuments = await Video.find({ link: regex });
        
        if(foundDocuments.length > 0) {
            const updateVideo = await Video.findByIdAndUpdate(foundDocuments[0]._id, { file_size: convertSizeToReadable(size) }, { new: true })
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