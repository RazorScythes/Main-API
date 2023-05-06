const Video               = require('../models/video.model')
const Users               = require('../models/user.model')
const uuid                = require('uuid');

exports.getVideos = async (req, res) => {
    const { id } = req.body

    let videos = await Video.find({})

    if(id) {
        const user = await Users.findById(id)

        if(user.safe_content)
            videos = videos.filter((item) => item.strict === user.safe_content)
        
        if(videos.length > 0) {
            res.status(200).json({ 
                result: videos
            })
        }
        else {
            res.status(404).json({ 
                message: "No available videos"
            })
        }
    }
    else {
        videos = videos.filter((item) => item.strict === false)

        if(videos.length > 0) {
            res.status(200).json({ 
                result: videos
            })
        }
        else {
            res.status(404).json({ 
                message: "No available videos"
            })
        }
    }
}

exports.addOneLikes = async (req, res) => {
    const { id, likes, dislikes } = req.body

    if(!id) return res.status(404).json({ variant: 'danger', message: err })

    try {
        Video.findByIdAndUpdate(id, { likes: likes, dislikes: dislikes }, { new: true })
            .then(() => {
                res.status(200)
            })
            .catch((err) => {
                return res.status(404).json({ variant: 'danger', message: err })
            })

        res.status(200)
    }
    catch (err) {
        console.log(err)
        return res.status(404).json({ variant: 'danger', message: 'invalid videoId' })
    }
}

exports.addOneDislikes = async (req, res) => {
    const { id, likes, dislikes } = req.body

    if(!id) return res.status(404).json({ variant: 'danger', message: err })

    try {
        Video.findByIdAndUpdate(id, { likes: likes, dislikes: dislikes }, { new: true })
            .then(() => {
                res.status(200)
            })
            .catch((err) => {
                return res.status(404).json({ variant: 'danger', message: err })
            })

        res.status(200)
    }
    catch (err) {
        console.log(err)
        return res.status(404).json({ variant: 'danger', message: 'invalid videoId' })
    }
}

exports.addOneViews = async (req, res) => {
    const { id, videoId } = req.body

    if(!videoId) return res.status(404).json({ variant: 'danger', message: err })

    try {
        let video = await Video.findById(videoId)

        let duplicate_id = false

        video.views.some((item) => {
            if(item === id) {
                duplicate_id = true
                return true
            }
        })

        if(!duplicate_id) {
            video.views.push(id)

            Video.findByIdAndUpdate(videoId, video, { new: true })
                .then(() => {
                    res.status(200)
                })
                .catch((err) => {
                    return res.status(404).json({ variant: 'danger', message: err })
                })
        }

        res.status(200)
    }
    catch (err) {
        console.log(err)
        return res.status(404).json({ variant: 'danger', message: 'invalid videoId' })
    }
}

exports.getVideoByID = async (req, res) => {
    const { videoId } = req.body

    if(!videoId) return res.status(404).json({ variant: 'danger', message: err })

    try {
        let video = await Video.findById(videoId).populate('user')

        if(!video) return res.status(404).json({ variant: 'danger', message: err })

        // video.comment.push({
        //     username: 'RazorScythe',
        //     avatar: 'https://drive.google.com/uc?export=view&id=1JXS9TY0EECySBZGStmN9vH_PiSSP6Eb5',
        //     comments: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum at tellus nulla. Pellentesque eget libero semper, commodo mauris vel, vehicula est. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum at tellus nulla. Pellentesque eget libero semper, commodo mauris vel, vehicula est.',
        //     date: Date.now()
        // })

        // await Video.findByIdAndUpdate(videoId, video, { new: true })
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

exports.getComments = async (req, res) => {
    const { videoId } = req.body

    if(!videoId) return res.status(404).json({ variant: 'danger', message: err })

    try {
        let video = await Video.findById(videoId).populate('user')

        if(!video) return res.status(404).json({ variant: 'danger', message: err })

        let sorted = video.comment.sort(function(a, b) {
                        var c = new Date(a.date);
                        var d = new Date(b.date);
                        return d-c;
                    });

        res.status(200).json({ 
            comments: sorted
        })
    }
    catch (err) {
        console.log(err)
        return res.status(404).json({ variant: 'danger', message: 'invalid videoId' })
    }
}

exports.uploadComment = async (req, res) => {

    const { id, avatar, user, comment } = req.body

    let video = await Video.findById(id).populate('user')

    if(!video) return res.status(404).json({ variant: 'danger', message: err })

    const newComment = {
        id: uuid.v4(),
        username: user,
        avatar: avatar,
        comments: comment,
        date: new Date()
    }

    video.comment.push(newComment)
   
    Video.findByIdAndUpdate(id, video, { new: true }).populate('user')
    .then((updated) => {
        let sorted = updated.comment.sort(function(a, b) {
            var c = new Date(a.date);
            var d = new Date(b.date);
            return d-c;
        });
        res.status(200).json({ 
            comments: sorted
        })
    })
    .catch((err) => {
        return res.status(404).json({ variant: 'danger', message: err })
    })
}

exports.removeComment = async (req, res) => {
    const { parent_id, comment_id } = req.body

    let video = await Video.findById(parent_id).populate('user')

    if(!video) return res.status(404).json({ variant: 'danger', message: err })

    const filtered = video.comment.filter(comments => comments.id !== comment_id)

    video.comment = filtered

    Video.findByIdAndUpdate(parent_id, video, { new: true }).populate('user')
    .then((updated) => {
        let sorted = updated.comment.sort(function(a, b) {
            var c = new Date(a.date);
            var d = new Date(b.date);
            return d-c;
        });
        res.status(200).json({ 
            comments: sorted
        })
    })
    .catch((err) => {
        console.log(err)
        return res.status(404).json({ variant: 'danger', message: err })
    })
}