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

const { changeBlogPrivacyById, changeBlogStrictById, removeBlog, bulkRemoveBlog, updateVideoProperties, getUserVideo, getUserGame, getUserBlog, uploadVideo, uploadGame, uploadBlog, editVideo, editGame, editBlog, removeVideo, removeGame, bulkRemoveVideo, bulkRemoveGame, changePrivacyById, changeStrictById, changeDownloadById, changeGameStrictById, changeGamePrivacyById } = require('../controller/uploads')

router.post('/getUserVideo', allowCors(getUserVideo))
router.post('/getUserGame', allowCors(getUserGame))
router.post('/getUserBlog', allowCors(getUserBlog))
router.post('/uploadVideo', allowCors(uploadVideo))
router.post('/uploadGame', allowCors(uploadGame))
router.post('/uploadBlog', allowCors(uploadBlog))
router.post('/editVideo', allowCors(editVideo))
router.post('/editGame', allowCors(editGame))
router.post('/editBlog', allowCors(editBlog))
router.post('/removeVideo', allowCors(removeVideo))
router.post('/bulkRemoveVideo', allowCors(bulkRemoveVideo))
router.post('/removeGame', allowCors(removeGame))
router.post('/bulkRemoveGame', allowCors(bulkRemoveGame))
router.post('/changePrivacyById', allowCors(changePrivacyById))
router.post('/changeStrictById', allowCors(changeStrictById))
router.post('/changeGamePrivacyById', allowCors(changeGamePrivacyById))
router.post('/changeGameStrictById', allowCors(changeGameStrictById))
router.post('/changeDownloadById', allowCors(changeDownloadById))
router.post('/updateVideoProperties', allowCors(updateVideoProperties))
router.post('/changeBlogPrivacyById', allowCors(changeBlogPrivacyById))
router.post('/changeBlogStrictById', allowCors(changeBlogStrictById))
router.post('/removeBlog', allowCors(removeBlog))
router.post('/bulkRemoveBlog', allowCors(bulkRemoveBlog))

module.exports = router 