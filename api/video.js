const express             = require('express')
const router              = express.Router()

const allowCors = fn => async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true)
    // res.setHeader('Access-Control-Allow-Origin', req.header('origin'))
    res.setHeader('Access-Control-Allow-Origin', '*')
    // another common pattern
    // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    if (req.method === 'OPTIONS') {
      res.status(200).end()
      return
    }
    return await fn(req, res)
}

const { getVideos, addOneLikes, addOneDislikes, addOneViews, getVideoByID, getVideoByTag, countVideoTags, getVideoByArtist, getVideoBySearchKey, getComments, getRelatedVideos, uploadComment, removeComment, addToWatchLater } = require('../controller/video')

router.post('/getVideos', allowCors(getVideos))
router.post('/addOneLikes', allowCors(addOneLikes))
router.post('/addOneDislikes', allowCors(addOneDislikes))
router.post('/addOneViews', allowCors(addOneViews))
router.post('/getVideoByID', allowCors(getVideoByID))
router.post('/getVideoByTag', allowCors(getVideoByTag))
router.post('/getVideoByArtist', allowCors(getVideoByArtist))
router.post('/getVideoBySearchKey', allowCors(getVideoBySearchKey))
router.post('/getComments', allowCors(getComments))
router.post('/getRelatedVideos', allowCors(getRelatedVideos))
router.post('/uploadComment', allowCors(uploadComment))
router.post('/removeComment', allowCors(removeComment))
router.post('/addToWatchLater', allowCors(addToWatchLater))
router.post('/countVideoTags', allowCors(countVideoTags))

module.exports = router 