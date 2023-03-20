const express       = require('express')
const router        = express.Router()

const { SignIn, getAdmin } = require('../controller/auth')

// // Define the allowCors middleware
// const allowCors = fn => async (req, res) => {
//     const origin = req.headers.origin;

//     res.setHeader('Access-Control-Allow-Credentials', true);
//     res.setHeader('Access-Control-Allow-Origin', origin || '*');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
//     if (req.method === 'OPTIONS') {
//       res.sendStatus(200);
//       return;
//     }
//     return await fn(req, res);
// };

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

router.post('/signin', allowCors(SignIn))
router.get('/test_user', getAdmin)

module.exports = router