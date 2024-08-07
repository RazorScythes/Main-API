const Video               = require('../models/video.model')
const ArchiveName         = require('../models/archiveName.model')
const Archive             = require('../models/archive.model')
const Reports             = require('../models/reports.model')
const Users               = require('../models/user.model')
const VideoArchive        = require('../models/videoArchive.model')
const ActivityLogs        = require('../models/activityLogs.model')
const uuid                = require('uuid');

exports.getVideos = async (req, res) => {
    const { id } = req.body

    let videos = await Video.find({}).sort({ createdAt: -1 }).populate('user')
    if(id) {
        const user = await Users.findById(id)
        const archive = await ArchiveName.findOne({ user: id, archive_name: 'Videos' })

        if(user.safe_content || user.safe_content === undefined)
            videos = videos.filter((item) => item.strict !== true)

        videos = videos.filter((item) => {
            return item.privacy !== true || user._id.equals(item.user._id);
          });

        if(videos.length > 0) {
            const collection = []
            videos.map(obj => {
                obj['user'] = {
                    username: obj.user.username,
                    avatar: obj.user.avatar
                }
                collection.push(obj);
            });

            res.status(200).json({ 
                result: collection,
                archiveList: archive
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
            const collection = []
            videos.map(obj => {
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
                message: "No available videos"
            })
        }
    }
}

exports.uploadLists = async (req, res) => {
    const { id, uploader_id } = req.body

    let videos = await Video.find({ user: uploader_id }).sort({ createdAt: -1 }).populate('user')

    if(id) {
        const user = await Users.findById(id)
        const archive = await ArchiveName.findOne({ user: id, archive_name: 'Videos' })

        if(user.safe_content || user.safe_content === undefined)
            videos = videos.filter((item) => item.strict !== true)

        if(videos.length > 0) {
            const collection = []
            videos.map(obj => {
                obj['user'] = {
                    username: obj.user.username,
                    avatar: obj.user.avatar
                }
                const jsonData = {
                    _id: obj._id,
                    title: obj.title,
                    views: obj.views,
                    link: obj.link,
                    strict: obj.strict,
                    likes: obj.likes,
                    views: obj.views,
                    user: obj.user,
                    privacy: obj.privacy,
                    file_size: obj.file_size ? obj.file_size : "",
                    createdAt: obj.createdAt,
                    downloadUrl: obj.downloadUrl,
                    thumbnailLink: obj.thumbnailLink,
                    duration: obj.duration,
                    embedLink: obj.embedLink,
                }
                collection.push(jsonData);
            });

            res.status(200).json({ 
                result: collection
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
            const collection = []
            videos.map(obj => {
                obj['user'] = {
                    username: obj.user.username,
                    avatar: obj.user.avatar
                }
                const jsonData = {
                    _id: obj._id,
                    title: obj.title,
                    views: obj.views,
                    link: obj.link,
                    strict: obj.strict,
                    likes: obj.likes,
                    views: obj.views,
                    user: obj.user,
                    privacy: obj.privacy,
                    file_size: obj.file_size ? obj.file_size : "",
                    createdAt: obj.createdAt,
                    downloadUrl: obj.downloadUrl,
                    thumbnailLink: obj.thumbnailLink,
                    duration: obj.duration,
                    embedLink: obj.embedLink,
                }
                collection.push(jsonData);
            });

            res.status(200).json({ 
                result: collection
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

    if(!id) return res.status(404).json({ variant: 'danger', message: 'invalid videoId' })

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

    if(!videoId) return res.status(404).json({ variant: 'danger', message: 'invalid videoId' })

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
    const { id, videoId, access_key } = req.body

    if(!videoId) return res.status(404).json({ variant: 'danger', message: "invalid videoId", notFound: true })

    try {
        let video = await Video.findById(videoId).populate('user')
        let video_uid = video.user._id
        let user = null
        
        if(id) user = await Users.findById(id)

        if(!video) return res.status(404).json({ variant: 'danger', message: "video id not found", notFound: true })

        const result = {
            id: video.user._id,
            username: video.user.username,
            avatar: video.user.avatar,
            video
        }
        result.video['user'] = {}

        if(user) {
            const archive = await ArchiveName.findOne({ user: id, archive_name: 'Videos' })
            const save_archive = await Archive.find({ user: id, content_type: 'Videos', content_id: videoId })
         
            if(user.safe_content || user.safe_content === undefined) {
                if(video.strict) { res.status(409).json({ forbiden: 'strict'}) }
                else if(video.privacy) { 
                    if(video.access_key === access_key || video_uid.equals(id)) res.status(200).json({ result: result, archiveList: archive, archiveSaveLists: save_archive })
                    else if(!access_key) res.status(409).json({ forbiden: 'private' }) 
                    else res.status(409).json({ forbiden: 'access_invalid' }) 
                }
                else { res.status(200).json({ result: result, archiveList: archive, archiveSaveLists: save_archive }) }
            }
            else {
                if(video.privacy) { 
                    if(video.access_key === access_key) {
                        if(video.access_key === access_key || video_uid.equals(id)) res.status(200).json({ result: result, archiveList: archive, archiveSaveLists: save_archive })
                        else if(!access_key) res.status(409).json({ forbiden: 'private' }) 
                        else res.status(409).json({ forbiden: 'access_invalid' }) 
                    }
                    res.status(409).json({ forbiden: 'private' }) 
                }
                else { res.status(200).json({ result: result, archiveList: archive, archiveSaveLists: save_archive }) }
            }
        }
        else {
            if(video.strict) { res.status(409).json({ forbiden: 'strict'}) }
            else if(video.privacy) { 
                if(video.access_key === access_key) {
                    if(!access_key) res.status(409).json({ forbiden: 'private' }) 
                    else if(video.access_key === access_key) res.status(200).json({ result: result, archiveList: [] })
                    else res.status(409).json({ forbiden: 'access_invalid' }) 
                }
                res.status(409).json({ forbiden: 'private' }) 
            }
            else { res.status(200).json({  result: result }) }
        }
    }
    catch(err) {
        console.log(err)
        return res.status(404).json({ variant: 'danger', message: 'invalid videoId', notFound: true })
    }
}

function countFilterTags(arr) {
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
        const archive = await ArchiveName.findOne({ user: id, archive_name: 'Videos' })

        if(user.safe_content || user.safe_content === undefined)
            deleteDuplicate = deleteDuplicate.filter((item) => item.strict !== true)

        deleteDuplicate = deleteDuplicate.filter((item) => item.privacy !== true)

        if(deleteDuplicate.length > 0) {
            res.status(200).json({ 
                result: deleteDuplicate,
                archiveList: archive,
                tags: countFilterTags(deleteDuplicate)
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
                result: deleteDuplicate,
                tags: countFilterTags(deleteDuplicate)
            })
        }
        else {
            res.status(404).json({ 
                message: "No available videos"
            })
        }
    }
}

exports.getVideoByArtist = async (req, res) => {
    const { id, artist } = req.body

    let videos = await Video.find({}).sort({ createdAt: -1 })
    let collected_videos = []

    if(!artist)
        return res.status(404).json({ 
            message: "No available videos"
        })

    videos.forEach((video) => {
        if(video.owner.toLowerCase() === artist.toLowerCase())
            collected_videos.push(video)
    })

    let deleteDuplicate = collected_videos.filter((obj, index, self) =>
        index === self.findIndex((o) => o._id.equals(obj._id))
    );

    if(id) {
        const user = await Users.findById(id)
        const archive = await ArchiveName.findOne({ user: id, archive_name: 'Videos' })

        if(user.safe_content || user.safe_content === undefined)
            deleteDuplicate = deleteDuplicate.filter((item) => item.strict !== true)

        deleteDuplicate = deleteDuplicate.filter((item) => item.privacy !== true)

        if(deleteDuplicate.length > 0) {
            res.status(200).json({ 
                result: deleteDuplicate,
                archiveList: archive,
                tags: countFilterTags(deleteDuplicate)
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
                result: deleteDuplicate,
                tags: countFilterTags(deleteDuplicate)
            })
        }
        else {
            res.status(404).json({ 
                message: "No available videos"
            })
        }
    }
}

exports.getVideoBySearchKey = async (req, res) => {
    const { id, searchKey } = req.body

    let videos = await Video.find({}).sort({ createdAt: -1 })
    let collected_videos = []

    if(!searchKey)
        return res.status(404).json({ 
            message: "No available videos"
        })

    videos.forEach((video) => {
        if(video.owner.toLowerCase().includes(searchKey.toLowerCase()) || video.title.toLowerCase().includes(searchKey.toLowerCase()))
            collected_videos.push(video)
    })

    let deleteDuplicate = collected_videos.filter((obj, index, self) =>
        index === self.findIndex((o) => o._id.equals(obj._id))
    );

    if(id) {
        const user = await Users.findById(id)
        const archive = await ArchiveName.findOne({ user: id, archive_name: 'Videos' })

        if(user.safe_content || user.safe_content === undefined)
            deleteDuplicate = deleteDuplicate.filter((item) => item.strict !== true)

        deleteDuplicate = deleteDuplicate.filter((item) => item.privacy !== true)

        if(deleteDuplicate.length > 0) {
            res.status(200).json({ 
                result: deleteDuplicate,
                archiveList: archive,
                tags: countFilterTags(deleteDuplicate)
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
                result: deleteDuplicate,
                tags: countFilterTags(deleteDuplicate)
            })
        }
        else {
            res.status(404).json({ 
                message: "No available videos"
            })
        }
    }
}

function getVideoCommentInfo(data) {
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

exports.getComments = async (req, res) => {
    const { videoId } = req.body

    if(!videoId) return res.status(404).json({ variant: 'danger', message: 'invalid videoId' })

    try {
        let video = await Video.findById(videoId).populate('user')

        if(!video) return res.status(404).json({ variant: 'danger', message: err })

        var collection = []
        video.comment.forEach((c) => {
            collection.push(getVideoCommentInfo(c))
        })
        Promise.all(collection)
        .then((comments_result) => {
            video.comment = comments_result
            let sorted = video.comment.sort(function(a, b) {
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
        const video = await Video.findById(id).populate('user')
        const jsonData = {
            _id: video._id,
            title: video.title,
            views: video.views,
            link: video.link,
            strict: video.strict,
            likes: video.likes,
            views: video.views,
            privacy: video.privacy,
            file_size: video.file_size ? video.file_size : "",
            createdAt: video.createdAt,
            downloadUrl: video.downloadUrl,
            thumbnailLink: video.thumbnailLink,
            duration: video.duration,
            embedLink: video.embedLink,
            username: video.user.username
        }
        resolve(jsonData)
    });
}

exports.getRelatedVideos = async(req, res) => {
    const { id, videoId } = req.body

    if(!videoId) return res.status(404).json({ variant: 'danger', message: 'invalid videoId' })
    
    try {
        let video = await Video.findById(videoId).populate('user')

        let user = null

        if(id) user = await Users.findById(id)

        if(!video) return res.status(404).json({ variant: 'danger', message: err })

        if(video.related_videos.length >= 30) {

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
            const slots = 30 //- video.related_videos.length
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
        parent_id: id,
        user: user,
        comments: comment,
        date: new Date()
    }

    video.comment.push(newComment)
   
    Video.findByIdAndUpdate(id, video, { new: true }).populate('user')
    .then((updated) => {
        var collection = []
        updated.comment.forEach((c) => {
            collection.push(getVideoCommentInfo(c))
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

exports.removeComment = async (req, res) => {
    const { parent_id, comment_id } = req.body

    let video = await Video.findById(parent_id).populate('user')

    if(!video) return res.status(404).json({ variant: 'danger', message: err })

    const filtered = video.comment.filter(comments => comments.id !== comment_id)

    video.comment = filtered

    Video.findByIdAndUpdate(parent_id, video, { new: true }).populate('user')
    .then((updated) => {
        var collection = []
        updated.comment.forEach((c) => {
            collection.push(getVideoCommentInfo(c))
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

exports.addToWatchLater = async (req, res) => {
    const { id, videoId, archiveId, directory } = req.body

    if(!id || !videoId) 
        return  res.status(404).json({ 
                    sideAlert: {
                        variant: "danger",
                        heading: "Missing Parameter",
                        paragraph: "Failed to add videos to watch list."
                    }
                })
    
    const videoArchives = await Archive.find({user: id, content_id: videoId, directory_name: directory, archive_name: archiveId, content_type: 'Videos'})

    if(videoArchives.length === 0) {
        const newWatchLaterObj = {
            user: id,
            archive_name: archiveId,
            directory_name: directory,
            content_type: 'Videos',
            content_id: videoId
        }

        const newWatchLater = new Archive(newWatchLaterObj)

        newWatchLater.save()
        .then(async () => {
            const save_archive = await Archive.find({ user: id, content_type: 'Videos', content_id: videoId })

            return res.status(200).json({ 
                archiveSaveLists: save_archive,
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

exports.countVideoTags = async (req, res) => {
    const { id } = req.body

    var videos = await Video.find({}).sort({ createdAt: -1 }).populate('user')
    var tag_list = []

    if(id) {
        const user = await Users.findById(id)

        if(user.safe_content || user.safe_content === undefined)
            videos = videos.filter((item) => item.strict !== true)

        videos = videos.filter((item) => item.privacy !== true)

        if(videos.length > 0) {
            videos.forEach((item) => {
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
                message: "No available videos"
            })
        }
    }
    else {
        videos = videos.filter((item) => item.strict === false)
        videos = videos.filter((item) => item.privacy !== true)

        if(videos.length > 0) {
            videos.forEach((item) => {
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
                message: "No available videos"
            })
        }
    }
}

const { google }            = require('googleapis');
const path                  = require('path')
const { Readable }          = require('stream')
var jwtClient = null

if(process.env.PRODUCTION) {
    jwtClient = new google.auth.JWT(
        process.env.CLIENT_EMAIL,
        null,
        process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/drive.file'],
        null
    );
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
}

function filenameBuffer(){
    return (uuid.v4() + Date.now())
}

function filename(base64String){
    return (uuid.v4() + path.extname(getExtensionName(base64String)))
}

function getExtensionName(base64String){
    return base64String.substring("data:image/".length, base64String.indexOf(";base64"))
}

function uploadSingleImage(image, folder){
    return new Promise(async (resolve, reject) => {
        const drive = google.drive({
            version: 'v3',
            auth: jwtClient
        }); 

        // Base64-encoded image data
        // const base64Data = base64;

        // Remove the data URI prefix and create a buffer from the base64-encoded data
        const buffer = fs.readFileSync(image);
        const base64String = buffer.toString('base64');
        // const imageData = Buffer.from(base64String.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        const imageBuffer = Buffer.from(base64String, 'base64');
        const mimeType = `image/png`;

        const fileMetadata = {
            name: filename(base64String),
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
                    return { error: "Error uploading image" }
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

exports.uploadReport = async (req, res) => {
    const { data } = req.body

    const newReport = new Reports(data)

    newReport.save()
    .then(async () => {
        return res.status(200).json({ 
            sideAlert: {
                variant: "success",
                heading: "Report Submitted",
                paragraph: "An admin will review this"
            }
        })
    })
    .catch((err) => {
        console.log(err)
        return res.status(404).json({ 
            sideAlert: {
                variant: "danger",
                heading: "Failed to Submit Report",
                paragraph: "Please try again later"
            }
        })
    })
}

// const fs = require('fs');

// let chrome = {};
// let puppeteer;

// if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
//   // running on the Vercel platform.
//   chrome = require('chrome-aws-lambda');
//   puppeteer = require('puppeteer-core');
// } else {
//   // running locally.
//   puppeteer = require('puppeteer');
// }


// exports.testAPI = async (req, res) => {
//     try {
//         let options;
//         if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
//             options = process.env.AWS_REGION ? 
//                 {
//                     args: chrome.args,
//                     executablePath: await chrome.executablePath,
//                     headless: chrome.headless
//                 }
//                 : 
//                 {
//                     args: [],
//                     executablePath:
//                     process.platform === 'win32'
//                         ? 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
//                         : process.platform === 'linux'
//                         ? '/usr/bin/google-chrome'
//                         : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
//                 };
//         }
//         else {
//             options = {
//                 args: ['--hide-scrollbars', '--disable-web-security'],
//                 defaultViewport: chrome.defaultViewport,
//                 executablePath: await chrome.executablePath,
//                 headless: true,
//                 ignoreHTTPSErrors: true,
//                 headless: 'new'
//             }
//         }

//         const browser = await puppeteer.launch(options);

//         // const browser = await chromium.puppeteer.launch({  
//         //     args: chromium.args,
//         //     defaultViewport: chromium.defaultViewport,
//         //     executablePath: await chromium.executablePath,
//         //     headless: chromium.headless,
//         //     ignoreHTTPSErrors: true,
//         // });
//         const page = await browser.newPage();
//         await page.goto("https://main-website-sage.vercel.app/Zantei25/portfolio", { waitUntil: 'networkidle0' });
//         page.setDefaultNavigationTimeout(1000000);

//         // Get the full height of the page by evaluating the document's height
//         // Calculate the full height of the page by evaluating the cumulative height of all elements
//         const fullPageHeight = await page.evaluate(() => {
//             const body = document.body;
//             const html = document.documentElement;
//             const maxHeight = Math.max(
//                 body.scrollHeight,
//                 body.offsetHeight,
//                 html.clientHeight,
//                 html.scrollHeight,
//                 html.offsetHeight
//             );
    
//             const children = document.body.children;
//             let cumulativeHeight = 0;
    
//             for (let i = 0; i < children.length; i++) {
//                 cumulativeHeight += children[i].offsetHeight;
//             }
    
//             return Math.max(maxHeight, cumulativeHeight);
//         });

//         // Set the viewport size to the desired desktop dimensions
//         var fixedHeight = 0
//         await page.evaluate((height) => {
//             fixedHeight = height
//         }, fullPageHeight);

//         await page.setViewport({
//             width: 1920, // Adjust width as needed
//             height: fixedHeight
//         });
        
//         const pathName = `${uuid.v4()}.png`;

//         await page.screenshot({ path: pathName, fullPage: true });
//         await browser.close();

//         uploadSingleImage(pathName, '18gaf5Bc6LEcOjKMA5Hz2EOIaW1ICqnAF')
//             .then((overlay_id) => {
//                 console.log(overlay_id)
//                 fs.unlink(pathName, (err) => {
//                     if (err) {
//                       console.error('Error deleting file:', err);
//                     } else {
//                       console.log('File deleted successfully');
//                     }
//                 });
//                 return res.status(200).json({ 
//                     message: 'Success'
//                 });
//             })
//             .catch((err) => {
//                 return res.status(500).json({ 
//                     message: 'Failed'
//                 });
//                 // return res.status(409).json({ 
//                 //     variant: 'danger',
//                 //     message: "500: Error uploading images."
//                 // });
//             })
//         // const filename = 'screenshot.png';
//         // const filepath = `${__dirname}/${filename}`;

//         // fs.writeFile(filepath, screenshotBuffer, (error) => {
//         // if (error) {
//         //     console.error('Error saving screenshot:', error);
//         //     // res.status(500).send('Error saving screenshot');
//         // } else {
//         //     console.log(filename)
//         //     //res.send({ filename });
//         // }
//         // });
//       } catch (error) {
//         //res.status(500).send('Error capturing screenshot:', error)
//         return res.status(500).json({ 
//             message: 'Error capturing screenshot: '+ error
//         });
//         console.error('Error capturing screenshot:', error);
//         // res.status(500).send('Error capturing screenshot');
//       }
// }


// // async function testAPI() {
// //     try {
// //         const browser = await puppeteer.launch({ headless: 'new' });
// //         const page = await browser.newPage();
// //         await page.goto("https://main-website-sage.vercel.app/Zantei25/portfolio", { waitUntil: 'networkidle0' });
// //         page.setDefaultNavigationTimeout(1000000);

// //         // Get the full height of the page by evaluating the document's height
// //         // Calculate the full height of the page by evaluating the cumulative height of all elements
// //         const fullPageHeight = await page.evaluate(() => {
// //             const body = document.body;
// //             const html = document.documentElement;
// //             const maxHeight = Math.max(
// //                 body.scrollHeight,
// //                 body.offsetHeight,
// //                 html.clientHeight,
// //                 html.scrollHeight,
// //                 html.offsetHeight
// //             );
    
// //             const children = document.body.children;
// //             let cumulativeHeight = 0;
    
// //             for (let i = 0; i < children.length; i++) {
// //                 cumulativeHeight += children[i].offsetHeight;
// //             }
    
// //             return Math.max(maxHeight, cumulativeHeight);
// //         });

// //         // Set the viewport size to the desired desktop dimensions
// //         var fixedHeight = 0
// //         await page.evaluate((height) => {
// //             fixedHeight = height
// //         }, fullPageHeight);

// //         await page.setViewport({
// //             width: 1920, // Adjust width as needed
// //             height: fixedHeight
// //         });
        
// //         const pathName = `${uuid.v4()}.png`;

// //         await page.screenshot({ path: pathName, fullPage: true });
// //         await browser.close();

// //         uploadSingleImage(pathName, '18gaf5Bc6LEcOjKMA5Hz2EOIaW1ICqnAF')
// //             .then((overlay_id) => {
// //                 console.log(overlay_id)
// //                 fs.unlink(pathName, (err) => {
// //                     if (err) {
// //                       console.error('Error deleting file:', err);
// //                     } else {
// //                       console.log('File deleted successfully');
// //                     }
// //                 });
// //             })
// //             .catch((err) => {
// //                 return res.status(409).json({ 
// //                     variant: 'danger',
// //                     message: "500: Error uploading images."
// //                 });
// //             })
// //         // const filename = 'screenshot.png';
// //         // const filepath = `${__dirname}/${filename}`;

// //         // fs.writeFile(filepath, screenshotBuffer, (error) => {
// //         // if (error) {
// //         //     console.error('Error saving screenshot:', error);
// //         //     // res.status(500).send('Error saving screenshot');
// //         // } else {
// //         //     console.log(filename)
// //         //     //res.send({ filename });
// //         // }
// //         // });
// //       } catch (error) {
// //         console.error('Error capturing screenshot:', error);
// //         // res.status(500).send('Error capturing screenshot');
// //       }
// // }

// // testAPI()
