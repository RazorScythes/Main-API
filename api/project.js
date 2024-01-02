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

const { getCategory, getProjects, getAdminCategory, getUserProject, uploadProject, editUserProject, removeUserProject, projectCountTags } = require('../controller/project')

router.post('/getCategory', allowCors(getCategory))
router.post('/getAdminCategory', allowCors(getAdminCategory))
router.post('/getProjects', allowCors(getProjects))
router.post('/uploadProject', allowCors(uploadProject))
router.post('/getUserProject', allowCors(getUserProject))
router.post('/editUserProject', allowCors(editUserProject))
router.post('/removeUserProject', allowCors(removeUserProject))
router.post('/projectCountTags', allowCors(projectCountTags))

module.exports = router 