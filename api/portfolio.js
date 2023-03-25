const express           = require('express')
const router            = express.Router()
const { allowCors }     = require('../cors')

const { uploadHero, getPortfolio } = require('../controller/portfolio')

router.post('/getPortfolio', allowCors(getPortfolio))
router.post('/hero', allowCors(uploadHero))

module.exports = router