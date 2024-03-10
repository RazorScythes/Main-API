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

const { blogsCountTags, getBlogs, getBlogsBySearchKey, getBlogByID, getBlogComments, uploadBlogComment, addOneBlogLikesBySearchKey, removeBlogComment, countBlogCategories, countBlogCategoriesBySearchKey, addOneBlogViews, addOneBlogLikes, getLatestBlogs, addLatestBlogLikes } = require('../controller/blogs')

router.post('/getBlogByID', allowCors(getBlogByID))
router.post('/getBlogs', allowCors(getBlogs))
router.post('/getBlogsBySearchKey', allowCors(getBlogsBySearchKey))
router.post('/getLatestBlogs', allowCors(getLatestBlogs))
router.post('/getBlogComments', allowCors(getBlogComments))
router.post('/uploadBlogComment', allowCors(uploadBlogComment))
router.post('/removeBlogComment', allowCors(removeBlogComment))
router.post('/countBlogCategories', allowCors(countBlogCategories))
router.post('/countBlogCategoriesBySearchKey', allowCors(countBlogCategoriesBySearchKey))
router.post('/addOneBlogViews', allowCors(addOneBlogViews))
router.post('/addOneBlogLikes', allowCors(addOneBlogLikes))
router.post('/addOneBlogLikesBySearchKey', allowCors(addOneBlogLikesBySearchKey))
router.post('/addLatestBlogLikes', allowCors(addLatestBlogLikes))
router.post('/blogsCountTags', allowCors(blogsCountTags))

module.exports = router 