const Game                = require('../models/games.model')
const Blog                = require('../models/blogs.model')
const Users               = require('../models/user.model')


function generateRandomID(length = 10) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }
  
    return result;
}
  
  // Usage example:
  const uniqueID = generateRandomID(20); // Generates a random ID with a length of 10 characters
  console.log(uniqueID);

  
exports.getGameByID = async (req, res) => {
    const { id, gameId } = req.body

    if(!gameId) return res.status(404).json({ variant: 'danger', message: "game id not found", notFound: true })

    try {
        let game = await Game.findById(gameId).populate('user')

        let user = null

        if(id) user = await Users.findById(id)

        if(!game) return res.status(404).json({ variant: 'danger', message: err, notFound: true })

        const result = {
            username: game.user.username,
            avatar: game.user.avatar,
            game
        }
        result.game['user'] = {}

        if(user) {
            if(user.safe_content || user.safe_content === undefined) {
                if(game.strict) { res.status(409).json({ forbiden: 'strict'}) }
                else if(game.privacy) { res.status(409).json({ forbiden: 'private' }) }
                else { res.status(200).json({  result: result }) }
            }
            else {
                if(game.privacy) { res.status(409).json({ forbiden: 'private' }) }
                else { res.status(200).json({ result: result }) }
            }
        }
        else {
            if(game.strict) { res.status(409).json({ forbiden: 'strict'}) }
            else if(game.privacy) { res.status(409).json({ forbiden: 'private' }) }
            else { res.status(200).json({  result: result }) }
        }
    }
    catch(err) {
        console.log(err)
        return res.status(404).json({ variant: 'danger', message: 'invalid gameId', notFound: true })
    }
}

exports.getGames = async (req, res) => {
    const { id } = req.body

    let games = await Game.find({}).sort({ createdAt: -1 }).populate('user')

    if(id) {
        const user = await Users.findById(id)

        if(user.safe_content || user.safe_content === undefined)
            games = games.filter((item) => item.strict !== true)

        games = games.filter((item) => item.privacy !== true)

        if(games.length > 0) {
            const collection = []
            games.map(obj => {
                obj['user'] = {
                    username: obj.user.username,
                    avatar: obj.user.avatar
                }
                collection.push(obj);
            });

            res.status(200).json({ 
                result: collection
            })
        }
        else {
            res.status(404).json({ 
                message: "No available games"
            })
        }
    }
    else {
        games = games.filter((item) => item.strict === false)
        games = games.filter((item) => item.privacy !== true)

        if(games.length > 0) {
            const collection = []
            games.map(obj => {
                obj['user'] = {
                    username: obj.user.username,
                    avatar: obj.user.avatar
                }
                collection.push(obj);
            });

            res.status(200).json({ 
                result: collection
            })
        }
        else {
            res.status(404).json({ 
                message: "No available games"
            })
        }
    }
}

exports.addOneDownload = async (req, res) => {
    const { id, gameId } = req.body

    if(!gameId) return res.status(404).json({ variant: 'danger', message: 'invalid videoId' })

    try {
        let game = await Game.findById(gameId)

        let duplicate_id = false

        game.download_count.some((item) => {
            if(item === id) {
                duplicate_id = true
                console.log("Id exists")
                return true
            }
        })

        if(!duplicate_id) {
            console.log("Id added")
            game.download_count.push(id)

            Game.findByIdAndUpdate(gameId, game, { new: true })
                .then(() => {
                    res.status(200)
                })
                .catch((err) => {
                    return res.status(404).json({ variant: 'danger', message: err })
                })
        }

        res.status(200)
    }
    catch (err) {
        console.log(err)
        return res.status(404).json({ variant: 'danger', message: 'invalid gameId' })
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

function getRandomIndices(array, loopCount) {
    // Check if array is empty or loop count is invalid
    if (array.length === 0 || loopCount <= 0 || !Number.isInteger(loopCount)) {
      throw new Error("Invalid input.");
    }
  
    // Create a copy of the original array
    const remainingIndices = array.slice();
    const pickedIndices = [];
  
    // Generate random indices without duplication
    for (let i = 0; i < loopCount; i++) {
      if (remainingIndices.length === 0) {
        // Array is exhausted, break the loop
        break;
      }
  
      // Generate a random index
      const randomIndex = Math.floor(Math.random() * remainingIndices.length);
  
      // Remove the selected index from the copy of array
      const pickedIndex = remainingIndices.splice(randomIndex, 1)[0];
  
      // Store the picked index
      pickedIndices.push(pickedIndex);
    }
  
    // Return the picked indices and the remaining indices in the array
    return pickedIndices
}

function getGameDataById(id) {
    return new Promise(async (resolve) => {
        var game = await Game.findById(id).populate('user')
        game['user'] = {
            username: game.user.username,
            avatar: game.user.avatar
        }
        resolve(game)
    });
}

exports.getRelatedGames = async(req, res) => {
    const { id, gameId } = req.body

    if(!gameId) return res.status(404).json({ variant: 'danger', message: err })
    
    try {
        let game = await Game.findById(gameId).populate('user')

        let user = null

        if(id) user = await Users.findById(id)

        if(!game) return res.status(404).json({ variant: 'danger', message: err })

        if(game.related_games.length >= 8) {

            let game_arr = []

            game.related_games.forEach((item) => {
                game_arr.push(getGameDataById(item))
            })

            Promise.all(game_arr)
            .then((game_results) => {
                if(user) {
                    let related = []

                    if(user.safe_content || user.safe_content === undefined) {
                        related = game_results.filter((item) => item.strict !== true)
                        related = related.filter((item) => item.privacy !== true)
                    }
                    else {
                        related = game_results.filter((item) => item.privacy !== true)
                    }
             
                    res.status(200).json({
                        result: related
                    })
                }
                else {
                    let related = game_results.filter((item) => item.strict !== true)
                    related = related.filter((item) => item.privacy !== true)
              
                    res.status(200).json({
                        result: related
                    })
                }
            })
            .catch((e) => {
                console.log(e)
                res.status(409).json({ message: e.message });
            });
        }
        else {
            const allGames = await Game.find({}).populate('user')
            const slots = 8 //- video.related_videos.length
            const collection = []

            const sorted = allGames.filter((item) => !item._id.equals(game._id) )

            sorted.forEach((item) => {
                if(item.user._id.equals(game.user._id)){
                    collection.push(item)
                }
                if(item.details.developer.toLowerCase() === game.details.developer.toLowerCase()){
                    collection.push(item)
                }
            })

            game.tags.forEach((item) => {
                sorted.forEach((data) => {
                    if(data.tags.indexOf(item) !== -1){
                        collection.push(item)
                    }
                })
            })

            const removeDuplicate = collection.filter((obj, index, self) =>
                index === self.findIndex((o) => o.title === obj.title)
            );

            const unrestrictedVideo = removeDuplicate.filter((item) => item.strict === false)
            let restrictedCount = 0

            const pickedCollection = removeDuplicate.length > 0 ? getRandomIndices(removeDuplicate, slots) : []

            pickedCollection.forEach((item) => {
                if(item.strict === true) restrictedCount++
            })

            const unrestrictedCollection = (unrestrictedVideo.length > 0 && restrictedCount > 0) ? getRandomIndices(unrestrictedVideo, restrictedCount) : []

            pickedCollection.push(...unrestrictedCollection)

            // video.related_videos.push(...pickedCollection)
            game.related_games = [...pickedCollection]

            const deleteDuplicate = game.related_games.filter((obj, index, self) =>
                index === self.findIndex((o) => o.title === obj.title)
            );

            let collection_id = []

            deleteDuplicate.forEach((item) => {
                collection_id.push(item._id)
            })

            game.related_games = collection_id

            Game.findByIdAndUpdate(gameId, game , { new: true })
                .then((result) => {
   
                    let game_arr = []

                    result.related_games.forEach((item) => {
                        game_arr.push(getGameDataById(item))
                    })

                    Promise.all(game_arr)
                    .then((game_results) => {
                        if(user) {

                            let related = []

                            if(user.safe_content || user.safe_content === undefined) {
                                related = game_results.filter((item) => item.strict !== true)
                                related = related.filter((item) => item.privacy !== true)
                            }
                            else {
                                related = game_results.filter((item) => item.privacy !== true)
                            }
        
                            res.status(200).json({
                                result: related
                            })
                        }
                        else {
                            let related = game_results.filter((item) => item.strict !== true)
                            related = related.filter((item) => item.privacy !== true)
                     
                            res.status(200).json({
                                result: related
                            })
                        }
                    })
                    .catch((e) => {
                        console.log(e)
                        res.status(409).json({ message: e.message });
                    });

                })
                .catch((err) => {
                    console.log(err)
                    return res.status(404).json({ variant: 'danger', message: err })
                })
        }
    }
    catch (err) {
        console.log(err)
        return res.status(404).json({ variant: 'danger', message: 'invalid videoId' })
    }
}

exports.countTags = async (req, res) => {
    const { id } = req.body

    var games = await Game.find({}).sort({ createdAt: -1 }).populate('user')
    var tag_list = []

    if(id) {
        const user = await Users.findById(id)

        if(user.safe_content || user.safe_content === undefined)
            games = games.filter((item) => item.strict !== true)

        games = games.filter((item) => item.privacy !== true)

        if(games.length > 0) {
            games.forEach((item) => {
                if(item.tags.length > 0) {
                    item.tags.forEach((tag) => {
                        tag_list.push(tag)
                    })
                }
            })

            const counts = tag_list.reduce((acc, tag) => {
                if (acc[tag]) {
                acc[tag]++;
                } else {
                acc[tag] = 1;
                }
                return acc;
            }, {});
            
            const result = Object.entries(counts).map(([tag, count]) => ({ tag, count }));

            res.status(200).json({
                result: result
            })
        }
        else {
            res.status(404).json({ 
                message: "No available games"
            })
        }
    }
    else {
        games = games.filter((item) => item.strict === false)
        games = games.filter((item) => item.privacy !== true)

        if(games.length > 0) {
            games.forEach((item) => {
                if(item.tags.length > 0) {
                    item.tags.forEach((tag) => {
                        tag_list.push(tag)
                    })
                }
            })

            const counts = tag_list.reduce((acc, tag) => {
                if (acc[tag]) {
                acc[tag]++;
                } else {
                acc[tag] = 1;
                }
                return acc;
            }, {});
            
            const result = Object.entries(counts).map(([tag, count]) => ({ tag, count }));

            res.status(200).json({
                result: result
            })
        }
        else {
            res.status(404).json({ 
                message: "No available games"
            })
        }
    }
}

exports.getGameByTag = async (req, res) => {
    const { id, tag } = req.body

    let games = await Game.find({}).sort({ createdAt: -1 }).populate('user')
    let collected_games = []

    games.forEach((game) => {
        tag.forEach((tag__) => {
            game.tags.forEach((tag_) => {
                if(tag__.toLowerCase() === tag_.toLowerCase())
                    collected_games.push(game)
            })
        })
    })

    let deleteDuplicate = collected_games.filter((obj, index, self) =>
        index === self.findIndex((o) => o._id.equals(obj._id))
    );

    if(id) {
        const user = await Users.findById(id)

        if(user.safe_content || user.safe_content === undefined)
            deleteDuplicate = deleteDuplicate.filter((item) => item.strict !== true)

        deleteDuplicate = deleteDuplicate.filter((item) => item.privacy !== true)

        if(deleteDuplicate.length > 0) {
            const collection = []
            deleteDuplicate.map(obj => {
                obj['user'] = {
                    username: obj.user.username,
                    avatar: obj.user.avatar
                }
                collection.push(obj);
            });

            res.status(200).json({ 
                result: collection
            })
        }
        else {
            res.status(404).json({ 
                message: "No Available Games"
            })
        }
    }
    else {
        deleteDuplicate = deleteDuplicate.filter((item) => item.strict === false)
        deleteDuplicate = deleteDuplicate.filter((item) => item.privacy !== true)

        if(deleteDuplicate.length > 0) {
            const collection = []
            deleteDuplicate.map(obj => {
                obj['user'] = {
                    username: obj.user.username,
                    avatar: obj.user.avatar
                }
                collection.push(obj);
            });

            res.status(200).json({ 
                result: collection
            })
        }
        else {
            res.status(404).json({ 
                message: "No Available Games"
            })
        }
    }
}

exports.getGameByDeveloper = async (req, res) => {
    var { id, developer } = req.body

    let games = await Game.find({}).sort({ createdAt: -1 }).populate('user')
    let collected_games = []

    if(!developer)
        return res.status(404).json({ 
            message: "No Available Games"
        })
    
    if(developer === "Anonymous") developer = ""

    games.forEach((game) => {
        if(game.details.developer?.toLowerCase() === developer.toLowerCase())
            collected_games.push(game)
    })

    let deleteDuplicate = collected_games.filter((obj, index, self) =>
        index === self.findIndex((o) => o._id.equals(obj._id))
    );

    if(id) {
        const user = await Users.findById(id)

        if(user.safe_content || user.safe_content === undefined)
            deleteDuplicate = deleteDuplicate.filter((item) => item.strict !== true)

        deleteDuplicate = deleteDuplicate.filter((item) => item.privacy !== true)

        if(deleteDuplicate.length > 0) {
            const collection = []
            deleteDuplicate.map(obj => {
                obj['user'] = {
                    username: obj.user.username,
                    avatar: obj.user.avatar
                }
                collection.push(obj);
            });

            res.status(200).json({ 
                result: collection
            })
        }
        else {
            res.status(404).json({ 
                message: "No Available Games"
            })
        }
    }
    else {
        deleteDuplicate = deleteDuplicate.filter((item) => item.strict === false)
        deleteDuplicate = deleteDuplicate.filter((item) => item.privacy !== true)

        if(deleteDuplicate.length > 0) {
            const collection = []
            deleteDuplicate.map(obj => {
                obj['user'] = {
                    username: obj.user.username,
                    avatar: obj.user.avatar
                }
                collection.push(obj);
            });

            res.status(200).json({ 
                result: collection
            })
        }
        else {
            res.status(404).json({ 
                message: "No Available Games"
            })
        }
    }
}

exports.getGameBySearchKey = async (req, res) => {
    const { id, searchKey } = req.body

    let games = await Game.find({}).sort({ createdAt: -1 }).populate('user')
    let collected_games = []

    if(!searchKey)
        return res.status(404).json({ 
            message: "No Available Games"
        })

    games.forEach((game) => {
        if(game.details.developer?.toLowerCase().includes(searchKey.toLowerCase()) || game.title.toLowerCase().includes(searchKey.toLowerCase()))
            collected_games.push(game)
    })

    let deleteDuplicate = collected_games.filter((obj, index, self) =>
        index === self.findIndex((o) => o._id.equals(obj._id))
    );

    if(id) {
        const user = await Users.findById(id)

        if(user.safe_content || user.safe_content === undefined)
            deleteDuplicate = deleteDuplicate.filter((item) => item.strict !== true)

        deleteDuplicate = deleteDuplicate.filter((item) => item.privacy !== true)

        if(deleteDuplicate.length > 0) {
            const collection = []
            deleteDuplicate.map(obj => {
                obj['user'] = {
                    username: obj.user.username,
                    avatar: obj.user.avatar
                }
                collection.push(obj);
            });

            res.status(200).json({ 
                result: collection
            })
        }
        else {
            res.status(404).json({ 
                message: "No Available Games"
            })
        }
    }
    else {
        deleteDuplicate = deleteDuplicate.filter((item) => item.strict === false)
        deleteDuplicate = deleteDuplicate.filter((item) => item.privacy !== true)

        if(deleteDuplicate.length > 0) {
            const collection = []
            deleteDuplicate.map(obj => {
                obj['user'] = {
                    username: obj.user.username,
                    avatar: obj.user.avatar
                }
                collection.push(obj);
            });

            res.status(200).json({ 
                result: collection
            })
        }
        else {
            res.status(404).json({ 
                message: "No Available Games"
            })
        }
    }
}

exports.getRecentGameBlog = async (req, res) => {
    const { id } = req.body 
    
    let blogs = await Blog.find({categories: 'Gaming'}).sort({ createdAt: -1 }).populate('user')

    if(id) {
        const user = await Users.findById(id)

        if(user.safe_content || user.safe_content === undefined)
            blogs = blogs.filter((item) => item.strict !== true)

        blogs = blogs.filter((item) => item.privacy !== true)

        if(blogs.length > 0) {
            const collection = []
            blogs.slice(0, 8).map(obj => {
                obj['user'] = {
                    username: obj.user.username,
                    avatar: obj.user.avatar
                }
                collection.push(obj);
            });

            res.status(200).json({ 
                result: collection.slice(0, 8)
            })
        }
        else {
            res.status(404).json({ 
                message: "No available blogs"
            })
        }
    }
    else {
        blogs = blogs.filter((item) => item.strict === false)
        blogs = blogs.filter((item) => item.privacy !== true)

        if(blogs.length > 0) {
            const collection = []
            blogs.slice(0, 8).map(obj => {
                obj['user'] = {
                    username: obj.user.username,
                    avatar: obj.user.avatar
                }
                collection.push(obj);
            });

            res.status(200).json({ 
                result: collection
            })
        }
        else {
            res.status(404).json({ 
                message: "No available blogs"
            })
        }
    }
}

exports.addRecentGamingBlogLikes = async (req, res) => {
    const { userId, id, likes } = req.body

    if(!id) return res.status(404).json({ variant: 'danger', message: 'invalid blogId' })

    try {
        Blog.findByIdAndUpdate(id, { likes: likes }, { new: true })
            .then(async () => {
                let blogs = await Blog.find({categories: 'Gaming'}).sort({ createdAt: -1 }).populate('user')

                if(userId) {
                    const user = await Users.findById(userId)

                    if(user.safe_content || user.safe_content === undefined)
                        blogs = blogs.filter((item) => item.strict !== true)

                    blogs = blogs.filter((item) => item.privacy !== true)

                    if(blogs.length > 0) {
                        const collection = []
                        blogs.slice(0, 8).map(obj => {
                            obj['user'] = {
                                username: obj.user.username,
                                avatar: obj.user.avatar
                            }
                            collection.push(obj);
                        });

                        res.status(200).json({ 
                            result: collection.slice(0, 8)
                        })
                    }
                    else {
                        res.status(404).json({ 
                            message: "No available blogs"
                        })
                    }
                }
                else {
                    blogs = blogs.filter((item) => item.strict === false)
                    blogs = blogs.filter((item) => item.privacy !== true)

                    if(blogs.length > 0) {
                        const collection = []
                        blogs.slice(0, 8).map(obj => {
                            obj['user'] = {
                                username: obj.user.username,
                                avatar: obj.user.avatar
                            }
                            collection.push(obj);
                        });

                        res.status(200).json({ 
                            result: collection
                        })
                    }
                    else {
                        res.status(404).json({ 
                            message: "No available blogs"
                        })
                    }
                }
            })
            .catch((err) => {
                return res.status(404).json({ variant: 'danger', message: err })
            })

        res.status(200)
    }
    catch (err) {
        console.log(err)
        return res.status(404).json({ variant: 'danger', message: 'invalid blogId' })
    }
}