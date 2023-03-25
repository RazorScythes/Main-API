const express           = require('express')
const router            = express.Router()
const { allowCors }     = require('../cors')

const { SignIn, getAdmin } = require('../controller/auth')

router.post('/signin', allowCors(SignIn))
router.get('/test_user', getAdmin)

module.exports = router