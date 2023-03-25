const express           = require('express')
const router            = express.Router()
const { allowCors }     = require('../cors')

const { uploadHero } = require('../controller/portfolio')

router.post('/hero', allowCors(uploadHero))

module.exports = router