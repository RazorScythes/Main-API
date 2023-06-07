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

const { userToken, verifyEmail, sendVerificationEmail, getProfile, updateProfile, updatePassword, updateOptions } = require('../controller/settings')

router.post('/userToken', allowCors(userToken))
router.post('/verifyEmail', allowCors(verifyEmail))
router.post('/sendVerificationEmail', allowCors(sendVerificationEmail))
router.post('/getProfile', allowCors(getProfile))
router.post('/updateProfile', allowCors(updateProfile))
router.post('/updatePassword', allowCors(updatePassword))
router.post('/updateOptions', allowCors(updateOptions))

module.exports = router 