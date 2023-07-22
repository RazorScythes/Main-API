const express             = require('express')
const router              = express.Router()

const allowCors = fn => async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true)
    // res.setHeader('Access-Control-Allow-Origin', req.header('origin'))
    res.setHeader('Access-Control-Allow-Origin', req.header('origin'))
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

const { getGames, getGameByID, getRelatedGames, addRatings, countTags, getGameByTag, getGameBySearchKey, getGameByDeveloper, getRecentGameBlog, addRecentGamingBlogLikes } = require('../controller/game')

router.post('/getGames', allowCors(getGames))
router.post('/getGameByID', allowCors(getGameByID))
router.post('/getRelatedGames', allowCors(getRelatedGames))
router.post('/addRatings', allowCors(addRatings))
router.post('/countTags', allowCors(countTags))
router.post('/getGameByTag', allowCors(getGameByTag))
router.post('/getGameByDeveloper', allowCors(getGameByDeveloper))
router.post('/getGameBySearchKey', allowCors(getGameBySearchKey))
router.post('/getRecentGameBlog', allowCors(getRecentGameBlog))
router.post('/addRecentGamingBlogLikes', allowCors(addRecentGamingBlogLikes))

module.exports = router 