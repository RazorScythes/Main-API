const Users                 = require('../models/user.model')
const Portfolio             = require('../models/portfolio.model')
const Logs                  = require('../models/logs.model')

function getUsers(data) {
    return new Promise(async (resolve, reject) => {
        if(data.viewer !== 'Unknown'){
            let user = await Users.findOne({ username: data.viewer})
            resolve({
                username: user.username,
                avatar: user.avatar,
                logs: data
            });
        }
        else{
            resolve({
                logs: data
            });
        }
    })
}

exports.getLogs = async (req, res) => {
    const { id } = req.body

    const logs = await Logs.find({user: id}).populate('user').sort({createdAt: -1})

    let arr = []

    logs.forEach((item) => {
        arr.push(getUsers(item))
    })

    Promise.all(arr)
        .then(async (result) => {
            return res.status(200).json({
                result: result
            });
        })
        .catch((e) => {
            console.log(e)
        });
}