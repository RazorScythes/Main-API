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

router.post('/signin', SignIn)
router.get('/test_user', getAdmin)

module.exports = router