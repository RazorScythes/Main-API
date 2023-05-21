const Video               = require('../models/video.model')
const Users               = require('../models/user.model')

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
    else {
        return res.status(404).json({ 
            variant: 'danger',
            message: "Error Fetching Videos"
        });
    }
    
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
    .catch(() => {
        return res.status(404).json({ 
            variant: 'danger',
            message: "Error Uploading Videos"
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