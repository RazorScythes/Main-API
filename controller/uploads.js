const Video               = require('../models/video.model')
const Users               = require('../models/user.model')

exports.getUserVideo = async (req, res) => {
    const { id } = req.body

    if(!id) return res.status(404).json({ 
        variant: 'danger',
        message: "Error 404: User not found."
    });

    Video.find({ user: id })
    .then((result) => {
        res.status(200).json({ 
            result: result,
        });
    })
    .catch(() => {
        return res.status(404).json({ 
            variant: 'danger',
            message: "Error Uploading Videos"
        });
    });
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
        let video = await Video.find({ user: id })

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