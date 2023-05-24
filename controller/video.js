const Video               = require('../models/video.model')
const Users               = require('../models/user.model')
const VideoArchive        = require('../models/videoArchive.model')
const uuid                = require('uuid');

exports.getVideos = async (req, res) => {
    const { id } = req.body

    let videos = await Video.find({}).sort({ createdAt: -1 })

    if(id) {
        const user = await Users.findById(id)

        if(user.safe_content || user.safe_content === undefined)
            videos = videos.filter((item) => item.strict !== true)

        videos = videos.filter((item) => item.privacy !== true)

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
        videos = videos.filter((item) => item.privacy !== true)

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
    const { id, videoId } = req.body

    if(!videoId) return res.status(404).json({ variant: 'danger', message: "video id not found", notFound: true })

    try {
        let video = await Video.findById(videoId).populate('user')

        let user = null
        
        if(id) user = await Users.findById(id)

        console.log(video)
        if(!video) return res.status(404).json({ variant: 'danger', message: err, notFound: true })

        const result = {
            username: video.user.username,
            avatar: video.user.avatar,
            video
        }

        if(user) {
            if(user.safe_content || user.safe_content === undefined) {
                if(video.strict) { res.status(409).json({ forbiden: 'strict'}) }
                else if(video.privacy) { res.status(409).json({ forbiden: 'private' }) }
                else { res.status(200).json({  result: result }) }
            }
            else {
                if(video.privacy) { res.status(409).json({ forbiden: 'private' }) }
                else { res.status(200).json({ result: result }) }
            }
        }
        else {
            if(video.strict) { res.status(409).json({ forbiden: 'strict'}) }
            else if(video.privacy) { res.status(409).json({ forbiden: 'private' }) }
            else { res.status(200).json({  result: result }) }
        }
    }
    catch(err) {
        console.log(err)
        return res.status(404).json({ variant: 'danger', message: 'invalid videoId', notFound: true })
    }
}

exports.getVideoByTag = async (req, res) => {
    const { id, tag } = req.body

    let videos = await Video.find({}).sort({ createdAt: -1 })
    let collected_videos = []

    videos.forEach((video) => {
        tag.forEach((tag__) => {
            video.tags.forEach((tag_) => {
                if(tag__.toLowerCase() === tag_.toLowerCase())
                    collected_videos.push(video)
            })
        })
    })

    let deleteDuplicate = collected_videos.filter((obj, index, self) =>
        index === self.findIndex((o) => o._id.equals(obj._id))
    );

    if(id) {
        const user = await Users.findById(id)

        if(user.safe_content || user.safe_content === undefined)
            deleteDuplicate = deleteDuplicate.filter((item) => item.strict !== true)

        deleteDuplicate = deleteDuplicate.filter((item) => item.privacy !== true)

        if(deleteDuplicate.length > 0) {
            res.status(200).json({ 
                result: deleteDuplicate
            })
        }
        else {
            res.status(404).json({ 
                message: "No available videos"
            })
        }
    }
    else {
        deleteDuplicate = deleteDuplicate.filter((item) => item.strict === false)
        deleteDuplicate = deleteDuplicate.filter((item) => item.privacy !== true)

        if(deleteDuplicate.length > 0) {
            res.status(200).json({ 
                result: deleteDuplicate
            })
        }
        else {
            res.status(404).json({ 
                message: "No available videos"
            })
        }
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

function getRandomIndices(array, loopCount) {
    // Check if array is empty or loop count is invalid
    if (array.length === 0 || loopCount <= 0 || !Number.isInteger(loopCount)) {
      throw new Error("Invalid input.");
    }
  
    // Create a copy of the original array
    const remainingIndices = array.slice();
    const pickedIndices = [];
  
    // Generate random indices without duplication
    for (let i = 0; i < loopCount; i++) {
      if (remainingIndices.length === 0) {
        // Array is exhausted, break the loop
        break;
      }
  
      // Generate a random index
      const randomIndex = Math.floor(Math.random() * remainingIndices.length);
  
      // Remove the selected index from the copy of array
      const pickedIndex = remainingIndices.splice(randomIndex, 1)[0];
  
      // Store the picked index
      pickedIndices.push(pickedIndex);
    }
  
    // Return the picked indices and the remaining indices in the array
    return pickedIndices
}

function getVideoDataById(id) {
    return new Promise(async (resolve) => {
        const video = await Video.findById(id)
        const jsonData = {
            _id: video._id,
            title: video.title,
            views: video.views,
            link: video.link,
            strict: video.strict,
            privacy: video.privacy,
            createdAt: video.createdAt
        }
        resolve(jsonData)
    });
}

exports.getRelatedVideos = async(req, res) => {
    const { id, videoId } = req.body

    if(!videoId) return res.status(404).json({ variant: 'danger', message: err })
    
    try {
        let video = await Video.findById(videoId).populate('user')

        let user = null

        if(id) user = await Users.findById(id)

        if(!video) return res.status(404).json({ variant: 'danger', message: err })

        if(video.related_videos.length >= 16) {

            let video_arr = []

            video.related_videos.forEach((item) => {
                video_arr.push(getVideoDataById(item))
            })

            Promise.all(video_arr)
            .then((video_results) => {
                if(user) {
                    let related = []

                    if(user.safe_content || user.safe_content === undefined) {
                        related = video_results.filter((item) => item.strict !== true)
                        related = related.filter((item) => item.privacy !== true)
                    }
                    else {
                        related = video_results.filter((item) => item.privacy !== true)
                    }
             
                    res.status(200).json({
                        relatedVideos: related
                    })
                }
                else {
                    let related = video_results.filter((item) => item.strict !== true)
                    related = related.filter((item) => item.privacy !== true)
              
                    res.status(200).json({
                        relatedVideos: related
                    })
                }
            })
            .catch((e) => {
                console.log(e)
                res.status(409).json({ message: e.message });
            });
        }
        else {
            const allVideos = await Video.find({}).populate('user')
            const slots = 16 //- video.related_videos.length
            const collection = []

            const sorted = allVideos.filter((item) => !item._id.equals(video._id) )

            sorted.forEach((item) => {
                if(item.user._id.equals(video.user._id)){
                    collection.push({
                        _id: item._id,
                        title: item.title,
                        views: item.views,
                        link: item.link,
                        strict: item.strict,
                        privacy: item.privacy,
                        createdAt: item.createdAt
                    })
                }
                if(item.owner.toLowerCase() === video.owner.toLowerCase()){
                    collection.push({
                        _id: item._id,
                        title: item.title,
                        views: item.views,
                        link: item.link,
                        strict: item.strict,
                        privacy: item.privacy,
                        createdAt: item.createdAt
                    })
                }
            })

            video.tags.forEach((item) => {
                sorted.forEach((data) => {
                    if(data.tags.indexOf(item) !== -1){
                        collection.push({
                            _id: data._id,
                            title: data.title,
                            views: data.views,
                            link: data.link,
                            strict: data.strict,
                            privacy: item.privacy,
                            createdAt: data.createdAt
                        })
                    }
                })
            })

            const removeDuplicate = collection.filter((obj, index, self) =>
                index === self.findIndex((o) => o.title === obj.title)
            );

            const unrestrictedVideo = removeDuplicate.filter((item) => item.strict === false)
            let restrictedCount = 0

            const pickedCollection = removeDuplicate.length > 0 ? getRandomIndices(removeDuplicate, slots) : []

            pickedCollection.forEach((item) => {
                if(item.strict === true) restrictedCount++
            })

            const unrestrictedCollection = (unrestrictedVideo.length > 0 && restrictedCount > 0) ? getRandomIndices(unrestrictedVideo, restrictedCount) : []

            pickedCollection.push(...unrestrictedCollection)

            // video.related_videos.push(...pickedCollection)
            video.related_videos = [...pickedCollection]

            const deleteDuplicate = video.related_videos.filter((obj, index, self) =>
                index === self.findIndex((o) => o.title === obj.title)
            );

            let collection_id = []

            deleteDuplicate.forEach((item) => {
                collection_id.push(item._id)
            })

            video.related_videos = collection_id

            Video.findByIdAndUpdate(videoId, video , { new: true })
                .then((result) => {
   
                    let video_arr = []

                    result.related_videos.forEach((item) => {
                        video_arr.push(getVideoDataById(item))
                    })

                    Promise.all(video_arr)
                    .then((video_results) => {
                        if(user) {

                            let related = []

                            if(user.safe_content || user.safe_content === undefined) {
                                related = video_results.filter((item) => item.strict !== true)
                                related = related.filter((item) => item.privacy !== true)
                            }
                            else {
                                related = video_results.filter((item) => item.privacy !== true)
                            }
        
                            res.status(200).json({
                                relatedVideos: related
                            })
                        }
                        else {
                            let related = video_results.filter((item) => item.strict !== true)
                            related = related.filter((item) => item.privacy !== true)
                     
                            res.status(200).json({
                                relatedVideos: related
                            })
                        }
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

exports.addToWatchLater = async (req, res) => {
    console.log(req.body)
    const { id, videoId } = req.body

    if(!id || !videoId) 
        return  res.status(404).json({ 
                    sideAlert: {
                        variant: "danger",
                        heading: "Missing Parameter",
                        paragraph: "Failed to add videos to watch list."
                    }
                })
    
    const videoArchives = await VideoArchive.find({})

    const videoExist = videoArchives.some((video) => {
        if(video.user.equals(id) && video.video.equals(videoId)) {
            return true
        }
    })
    console.log(videoExist)
    if(!videoExist) {
        const newWatchLaterObj = {
            user: id,
            video: videoId
        }

        const newWatchLater = new VideoArchive(newWatchLaterObj)

        newWatchLater.save()
        .then(() => {
            return res.status(200).json({ 
                sideAlert: {
                    variant: "success",
                    heading: "Added to Watch Later",
                    paragraph: "You can view this in your archive"
                }
            })
        })
        .catch((err) => {
            console.log(err)
            return res.status(404).json({ 
                sideAlert: {
                    variant: "danger",
                    heading: "Added Failed",
                    paragraph: "Failed to add videos to watch list."
                }
            })
        })
    }
    else {
        return res.status(409).json({ 
            sideAlert: {
                variant: "danger",
                heading: "Video Already Added",
                paragraph: "Please check your archive."
            }
        })
    }
}