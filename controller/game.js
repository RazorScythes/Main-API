const Game                = require('../models/games.model')
const Users               = require('../models/user.model')

exports.getGames = async (req, res) => {
    const { id } = req.body

    let games = await Game.find({}).sort({ createdAt: -1 }).populate('user')

    if(id) {
        const user = await Users.findById(id)

        if(user.safe_content || user.safe_content === undefined)
            games = games.filter((item) => item.strict !== true)

        games = games.filter((item) => item.privacy !== true)

        if(games.length > 0) {
            res.status(200).json({ 
                result: games
            })
        }
        else {
            res.status(404).json({ 
                message: "No available videos"
            })
        }
    }
    else {
        games = games.filter((item) => item.strict === false)
        games = games.filter((item) => item.privacy !== true)

        if(games.length > 0) {
            res.status(200).json({ 
                result: games
            })
        }
        else {
            res.status(404).json({ 
                message: "No available videos"
            })
        }
    }
}

exports.addRatings = async (req, res) => {
    const { gameId, ratings } = req.body

    if(!gameId || !req.headers.uid) 
        return res.status(404).json({ 
            variant: 'danger',
            message: "Error 404: User not found."
        });
    
    try {
        let game = await Game.findById(gameId).populate('user')

        const index = game.ratings.findIndex(item => item.id === req.headers.uid);

        if (index !== -1) {
            game.ratings[index].rating = ratings;
        } else {
            game.ratings.push({ id: req.headers.uid, rating: ratings });
        }

        Game.findByIdAndUpdate(gameId, game, { new: true })
        .then(async (result) => {
            const updated_game = await Game.findById(result._id).populate('user')

            res.status(200).json({ 
                result: updated_game,
            })
        })
        .catch((err) => {
            console.log(err)
            return res.status(404).json({ 
                variant: 'danger',
                message: "Error finding game"
            });
        })
    }
    catch(err) {
        console.log(err)
        return res.status(404).json({ 
            variant: 'danger',
            message: "Error finding game"
        });
    }
}