const express           = require('express')
const router            = express.Router()

const allowCors = fn => async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true)
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

const { getArchiveNameById, getArchiveDataById, newArchiveList, removeArchiveList } = require('../controller/archive')

router.post('/getArchiveNameById', allowCors(getArchiveNameById))
router.post('/getArchiveDataById', allowCors(getArchiveDataById))
router.post('/newArchiveList', allowCors(newArchiveList))
router.post('/removeArchiveList', allowCors(removeArchiveList))

module.exports = router