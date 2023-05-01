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

const { addOneLikes, addOneDislikes, addOneViews, getVideoByID, getComments, uploadComment, removeComment } = require('../controller/video')

router.post('/addOneLikes', allowCors(addOneLikes))
router.post('/addOneDislikes', allowCors(addOneDislikes))
router.post('/addOneViews', allowCors(addOneViews))
router.post('/getVideoByID', allowCors(getVideoByID))
router.post('/getComments', allowCors(getComments))
router.post('/uploadComment', allowCors(uploadComment))
router.post('/removeComment', allowCors(removeComment))

module.exports = router 