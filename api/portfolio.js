const multer            = require('multer')
const express             = require('express')
const router              = express.Router()

const { publishPortfolio, unpublishPortfolio, uploadHero, getPortfolio, getPortfolioByUsername, uploadSkills, uploadServices, addExperience, updateExperience, addProject, updateProject, deleteProject, sendTestEmail, uploadContacts } = require('../controller/portfolio')

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

router.post('/publishPortfolio', allowCors(publishPortfolio))
router.post('/unpublishPortfolio', allowCors(unpublishPortfolio))
router.post('/getPortfolio', allowCors(getPortfolio))
router.post('/getPortfolioByUsername', allowCors(getPortfolioByUsername))
router.post('/hero', allowCors(uploadHero))
router.post('/skills', allowCors(uploadSkills))
router.post('/services', allowCors(uploadServices))
router.post('/addExperience', allowCors(addExperience))
router.post('/updateExperience', allowCors(updateExperience))
router.post('/addProject', allowCors(addProject))
router.post('/updateProject', allowCors(updateProject))
router.post('/deleteProject', allowCors(deleteProject))
router.post('/uploadContacts', allowCors(uploadContacts))
router.post('/testEmail', allowCors(sendTestEmail))

module.exports = router 