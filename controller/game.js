const Game                = require('../models/games.model')
const Category            = require('../models/category.model')
const Blog                = require('../models/blogs.model')
const Users               = require('../models/user.model')
const uuid                = require('uuid');
  
exports.getGameByID = async (req, res) => {
    const { id, gameId, access_key, cookie_id } = req.body

    if(!gameId) return res.status(404).json({ variant: 'danger', message: "game id not found", notFound: true })

    try {
        let game = await Game.findById(gameId).populate('user')
        let game_uid = game.user._id
        let user = null

        if(id) user = await Users.findById(id)

        if(!game) return res.status(404).json({ variant: 'danger', message: err, notFound: true })

        const result = {
            username: game.user.username,
            avatar: game.user.avatar,
            game
        }
        result.game['user'] = {}

        var access = game.access_key;

        if(user) {
            if(user.safe_content || user.safe_content === undefined) {
                if(game.strict) { res.status(409).json({ forbiden: 'strict'}) }
                else if(game.privacy) { 
                    if(game_uid.equals(id)) return res.status(200).json({ result: result })
                    if(!access_key) return res.status(409).json({ forbiden: 'private' }) 

                    var checkUser = false;
                    var found_key = false;
                    access.forEach((key) => {
                        if(key.key === access_key)
                            found_key = true
                            if(key.user_downloaded.length > 0) {
                                key.user_downloaded.forEach((user) => {
                                    if(user.cookie_id === cookie_id || user.user_id === id) {
                                        checkUser = user.cookie_id ? user.cookie_id : user.user_id ? user.user_id : 'empty';
                                    }
                                })
                            }
                    })

                    if(!found_key) return res.status(409).json({ forbiden: 'access_invalid' }) 

                    var checkLimit = false

                    if(!checkUser) {
                        var checkLimit = false
                        access.forEach(async (key, i) => {
                            if(key.key === access_key && Number(key.download_limit) > 0) {
                                checkUser = true;
                                checkLimit = true
                            }
                        })
                        if(!checkLimit) return res.status(409).json({ forbiden: 'access_limit' })  
                        else {
                            return res.status(200).json({ result: result, forbiden: 'access_granted' })
                        } 
                    }

                    if(checkUser) {
                        return res.status(200).json({ result: result })
                    }
                    else {
                        return res.status(409).json({ forbiden: 'private' }) 
                    }
                }
                else { res.status(200).json({  result: result }) }
            }
            else {
                if(game.privacy) { 
                    if(game_uid.equals(id)) return res.status(200).json({ result: result })
                    if(!access_key) return res.status(409).json({ forbiden: 'private' }) 

                    var checkUser = false;
                    var found_key = false;
                    access.forEach((key) => {
                        if(key.key === access_key)
                            found_key = true
                            if(key.user_downloaded.length > 0) {
                                key.user_downloaded.forEach((user) => {
                                    if(user.cookie_id === cookie_id || user.user_id === id) {
                                        checkUser = true;
                                    }
                                })
                            }
                    })

                    if(!found_key) return res.status(409).json({ forbiden: 'access_invalid' }) 

                    var checkLimit = false

                    if(!checkUser) {
                        var checkLimit = false
                        access.forEach(async (key, i) => {
                            if(key.key === access_key && Number(key.download_limit) > 0) {
                                checkUser = true
                                checkLimit = true
                            }
                        })
                        if(!checkLimit) return res.status(409).json({ forbiden: 'access_limit' })  
                        else {
                            return res.status(200).json({ result: result, forbiden: 'access_granted' })
                        } 
                    }

                    if(checkUser) {
                        return res.status(200).json({ result: result })
                    }
                    else {
                        return res.status(409).json({ forbiden: 'private' }) 
                    }
                }
                else { res.status(200).json({ result: result }) }
            }
        }
        else {
            if(game.strict) { res.status(409).json({ forbiden: 'strict'}) }
            else if(game.privacy) { 
                if(!access_key) return res.status(409).json({ forbiden: 'private' }) 

                var checkUser = false;
                var found_key = false;
                access.forEach((key) => {
                    if(key.key === access_key)
                        found_key = true
                        if(key.user_downloaded.length > 0) {
                            key.user_downloaded.forEach((user) => {
                                if(user.cookie_id === cookie_id) {
                                    checkUser = true;
                                }
                            })
                        }
                })

                if(!found_key) return res.status(409).json({ forbiden: 'access_invalid' }) 

                var checkLimit = false

                if(!checkUser) {
                    var checkLimit = false
                    access.forEach(async (key, i) => {
                        if(key.key === access_key && Number(key.download_limit) > 0) {
                            checkUser = true
                            checkLimit = true
                        }
                    })
                    if(!checkLimit) return res.status(409).json({ forbiden: 'access_limit' })  
                    else {
                        return res.status(200).json({ result: result, forbiden: 'access_granted' })
                    } 
                }

                if(checkUser) {
                    return res.status(200).json({ result: result })
                }
                else {
                    return res.status(409).json({ forbiden: 'private' }) 
                }
            }
            else { res.status(200).json({  result: result }) }
        }
    }
    catch(err) {
        console.log(err)
        return res.status(404).json({ variant: 'danger', message: 'invalid gameId', notFound: true })
    }
}

exports.updateGameAccessKey = async (req, res) => {
    const { id, gameId, access_key, cookie_id } = req.body

    if(!gameId) return res.status(404).json({ variant: 'danger', message: "game id not found", notFound: true })

    try {
        let game = await Game.findById(gameId).populate('user')

        const index = game.access_key.findIndex(item => item.key === access_key);

        const obj = {
            cookie_id: cookie_id,
            user_id: id
        }
        game.access_key[index].download_limit -= 1;
        game.access_key[index].user_downloaded.push(obj)

        await Game.findByIdAndUpdate(gameId, game, { new: true })

    } catch (err) {
        console.log(err)
    }
}

exports.getGames = async (req, res) => {
    const { id } = req.body

    let games = await Game.find({}).sort({ createdAt: -1 }).populate('user')

    if(id) {
        const user = await Users.findById(id)

        if(user.safe_content || user.safe_content === undefined)
            games = games.filter((item) => item.strict !== true)

        games = games.filter((item) => {
            return item.privacy !== true || user._id.equals(item.user._id);
        });

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

// async function testCategoryCount() {
//     const games = await Game.find({}).sort({ createdAt: -1 }).populate('user');
//     const categories = await Category.find({ type: 'games' });

//     const categoryCounts = {};

//     // Initialize categoryCounts with 0 counts for each category
//     categories.forEach(category => {
//         categoryCounts[category.category] = 0;
//     });

//     // Count occurrences of each category in games
//     games.forEach(game => {
//         if (categoryCounts[game.category] !== undefined) {
//             categoryCounts[game.category]++;
//         }
//     });

//     const collection = Object.keys(categoryCounts).map(category => ({
//         category,
//         count: categoryCounts[category]
//     }));

//     console.log(collection);
// }
// testCategoryCount();

exports.categoriesCount = async (req, res) => {
    const { id } = req.body

    var games = await Game.find({}).sort({ createdAt: -1 }).populate('user')
    const categories = await Category.find({ type: 'games' });

    var tag_list = []

    if(id) {
        const user = await Users.findById(id)

        if(user.safe_content || user.safe_content === undefined)
            games = games.filter((item) => item.strict !== true)

        games = games.filter((item) => item.privacy !== true)

        if(games.length > 0) {
            const categoryCounts = {};

            categories.forEach(category => {
                categoryCounts[category.category] = 0;
            });

            games.forEach(game => {
                if (categoryCounts[game.category] !== undefined) {
                    categoryCounts[game.category]++;
                }
            });

            const collection = Object.keys(categoryCounts).map(category => ({
                category,
                count: categoryCounts[category]
            }));

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
            const categoryCounts = {};

            categories.forEach(category => {
                categoryCounts[category.category] = 0;
            });

            games.forEach(game => {
                if (categoryCounts[game.category] !== undefined) {
                    categoryCounts[game.category]++;
                }
            });

            const collection = Object.keys(categoryCounts).map(category => ({
                category,
                count: categoryCounts[category]
            }));

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

function countFilterTags(arr) {
    var tag_list = []
    arr.forEach((item) => {
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
    return result
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
                result: collection,
                tags: countFilterTags(deleteDuplicate)
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
                result: collection,
                tags: countFilterTags(deleteDuplicate)
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
                result: collection,
                tags: countFilterTags(deleteDuplicate)
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
                result: collection,
                tags: countFilterTags(deleteDuplicate)
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

function getGameCommentInfo(data) {
    return new Promise(async (resolve) => {
        const user = await Users.findById(data.user)
        const obj = {
            id: data.id,
            parent_id: data.parent_id,
            username: user.username,
            avatar: user.avatar,
            comments: data.comments,
            date: data.date
        }
        resolve(obj)
    });
}

exports.getGameComments = async (req, res) => {
    const { gameId } = req.body

    if(!gameId) return res.status(404).json({ variant: 'danger', message: err })

    try {
        let game = await Game.findById(gameId).populate('user')

        if(!game) return res.status(404).json({ variant: 'danger', message: err })

        var collection = []
        game.comment.forEach((c) => {
            collection.push(getGameCommentInfo(c))
        })
        Promise.all(collection)
        .then((comments_result) => {
            game.comment = comments_result
            let sorted = game.comment.sort(function(a, b) {
                var c = new Date(a.date);
                var d = new Date(b.date);
                return d-c;
            });

            res.status(200).json({ 
                comments: sorted
            })
        })
        .catch((e) => {
            console.log(e)
            res.status(409).json({ message: e.message });
        });
    }
    catch (err) {
        console.log(err)
        return res.status(404).json({ variant: 'danger', message: 'invalid videoId' })
    }
}

exports.uploadGameComment = async (req, res) => {
    const { id, avatar, user, comment } = req.body

    let game = await Game.findById(id).populate('user')

    if(!game) return res.status(404).json({ variant: 'danger', message: err })

    const newComment = {
        id: uuid.v4(),
        parent_id: id,
        user: user,
        comments: comment,
        date: new Date()
    }

    game.comment.push(newComment)
   
    Game.findByIdAndUpdate(id, game, { new: true }).populate('user')
    .then((updated) => {
        var collection = []
        updated.comment.forEach((c) => {
            collection.push(getGameCommentInfo(c))
        })
        Promise.all(collection)
        .then((comments_result) => {
            let sorted = comments_result.sort(function(a, b) {
                var c = new Date(a.date);
                var d = new Date(b.date);
                return d-c;
            });
            res.status(200).json({ 
                comments: sorted
            })
        })
        .catch((e) => {
            console.log(e)
            res.status(409).json({ message: e.message });
        });
    })
    .catch((err) => {
        return res.status(404).json({ variant: 'danger', message: err })
    })
}

exports.removeGameComment = async (req, res) => {
    const { parent_id, comment_id } = req.body

    let game = await Game.findById(parent_id).populate('user')

    if(!game) return res.status(404).json({ variant: 'danger', message: err })

    const filtered = game.comment.filter(comments => comments.id !== comment_id)

    game.comment = filtered

    Game.findByIdAndUpdate(parent_id, game, { new: true }).populate('user')
    .then((updated) => {
        var collection = []
        updated.comment.forEach((c) => {
            collection.push(getGameCommentInfo(c))
        })
        Promise.all(collection)
        .then((comments_result) => {
            let sorted = comments_result.sort(function(a, b) {
                var c = new Date(a.date);
                var d = new Date(b.date);
                return d-c;
            });
            res.status(200).json({ 
                comments: sorted
            })
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
