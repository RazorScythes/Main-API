const express       = require('express')
const router        = express.Router()

const { SignIn, getAdmin } = require('../controller/auth')

router.post('/signin', SignIn)
router.get('/test_user', getAdmin)

module.exports = router