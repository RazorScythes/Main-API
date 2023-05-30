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

const { getUserVideo, getUserGame, uploadVideo, uploadGame, editVideo, removeVideo, bulkRemoveVideo, changePrivacyById, changeStrictById, changeDownloadById } = require('../controller/uploads')

router.post('/getUserVideo', allowCors(getUserVideo))
router.post('/getUserGame', allowCors(getUserGame))
router.post('/uploadVideo', allowCors(uploadVideo))
router.post('/uploadGame', allowCors(uploadGame))
router.post('/editVideo', allowCors(editVideo))
router.post('/removeVideo', allowCors(removeVideo))
router.post('/bulkRemoveVideo', allowCors(bulkRemoveVideo))
router.post('/changePrivacyById', allowCors(changePrivacyById))
router.post('/changeStrictById', allowCors(changeStrictById))
router.post('/changeDownloadById', allowCors(changeDownloadById))

module.exports = router 