const Video               = require('../models/video.model')

exports.getVideoByID = async (req, res) => {
    const { videoId } = req.body

    if(!videoId) return res.status(404).json({ variant: 'danger', message: err })

    try {
        let video = await Video.findById(videoId).populate('user')

        if(!video) return res.status(404).json({ variant: 'danger', message: err })

        const result = {
            username: video.user.username,
            avatar: video.user.avatar,
            video
        }

        res.status(200).json({ 
            result: result
        })
    }
    catch(err) {
        console.log(err)
        return res.status(404).json({ variant: 'danger', message: 'invalid videoId' })
    }
}
