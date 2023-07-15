const Users               = require('../models/user.model')
const Blog                = require('../models/blogs.model')
const uuid                = require('uuid');

exports.getBlogByID = async (req, res) => {
    const { id, blogId } = req.body

    if(!blogId) return res.status(404).json({ variant: 'danger', message: "blog id not found", notFound: true })

    try {
        let blogs = await Blog.find().populate('user')
        let index = blogs.findIndex((obj) => obj['_id'].equals(blogId));
        let blog =  blogs.find((obj) => obj['_id'].equals(blogId));
        let next, prev;
        let user = null

        if(id) user = await Users.findById(id)

        if(!blog) return res.status(404).json({ variant: 'danger', message: err, notFound: true })
        if(index !== blogs.length - 1) next = blogs[index+1]._id
        if(index !== 0) prev = blogs[index-1]._id

        const result = {
            username: blog.user.username,
            avatar: blog.user.avatar,
            blog, 
            next: next ? next : '',
            prev: prev ? prev : ''
        }
        result.blog['user'] = {}

        if(user) {
            if(user.safe_content || user.safe_content === undefined) {
                if(blog.strict) { res.status(409).json({ forbiden: 'strict'}) }
                else if(blog.privacy) { res.status(409).json({ forbiden: 'private' }) }
                else { res.status(200).json({  result: result }) }
            }
            else {
                if(blog.privacy) { res.status(409).json({ forbiden: 'private' }) }
                else { res.status(200).json({ result: result }) }
            }
        }
        else {
            if(blog.strict) { res.status(409).json({ forbiden: 'strict'}) }
            else if(blog.privacy) { res.status(409).json({ forbiden: 'private' }) }
            else { res.status(200).json({  result: result }) }
        }
    }
    catch(err) {
        console.log(err)
        return res.status(404).json({ variant: 'danger', message: 'invalid blogId', notFound: true })
    }
}

exports.getBlogs = async(req, res) => {
    const { id } = req.body

    let blogs = await Blog.find({}).sort({ createdAt: -1 }).populate('user')

    if(id) {
        const user = await Users.findById(id)

        if(user.safe_content || user.safe_content === undefined)
            blogs = blogs.filter((item) => item.strict !== true)

        blogs = blogs.filter((item) => item.privacy !== true)

        if(blogs.length > 0) {
            const collection = []
            blogs.map(obj => {
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
    else {
        blogs = blogs.filter((item) => item.strict === false)
        blogs = blogs.filter((item) => item.privacy !== true)

        if(blogs.length > 0) {
            const collection = []
            blogs.map(obj => {
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

exports.getLatestBlogs = async(req, res) => {
    const { id, blogId } = req.body

    let blogs = await Blog.find({}).sort({ createdAt: -1 }).populate('user')

    if(id) {
        const user = await Users.findById(id)

        if(user.safe_content || user.safe_content === undefined)
            blogs = blogs.filter((item) => item.strict !== true)

        blogs = blogs.filter((item) => item.privacy !== true)

        if(blogs.length > 0) {
            const latestBlogs = blogs.slice(0, 8)
            const filterBlogs = latestBlogs.filter((blog) => !blog._id.equals(blogId))
            const collection = []
            filterBlogs.map(obj => {
                let newObj = {
                    _id: obj._id,
                    featured_image: obj.featured_image,
                    post_title: obj.post_title,
                    createdAt: obj.createdAt
                }
                collection.push(newObj);
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
    else {
        blogs = blogs.filter((item) => item.strict === false)
        blogs = blogs.filter((item) => item.privacy !== true)

        if(blogs.length > 0) {
            const latestBlogs = blogs.slice(0, 8)
            const filterBlogs = latestBlogs.filter((blog) => !blog._id.equals(blogId))
            const collection = []
            filterBlogs.map(obj => {
                let newObj = {
                    featured_image: obj.featured_image,
                    post_title: obj.post_title,
                    createdAt: obj.createdAt
                }
                collection.push(newObj);
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

function getBlogCommentInfo(data) {
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

exports.getBlogComments = async (req, res) => {
    const { blogId } = req.body

    if(!blogId) return res.status(404).json({ variant: 'danger', message: err })

    try {
        let blog = await Blog.findById(blogId).populate('user')

        if(!blog) return res.status(404).json({ variant: 'danger', message: err })

        var collection = []
        blog.comment.forEach((c) => {
            collection.push(getBlogCommentInfo(c))
        })
        Promise.all(collection)
        .then((comments_result) => {
            blog.comment = comments_result
            let sorted = blog.comment.sort(function(a, b) {
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

exports.uploadBlogComment = async (req, res) => {
    const { id, avatar, user, comment } = req.body

    let blog = await Blog.findById(id).populate('user')

    if(!blog) return res.status(404).json({ variant: 'danger', message: err })

    const newComment = {
        id: uuid.v4(),
        parent_id: id,
        user: user,
        comments: comment,
        date: new Date()
    }

    blog.comment.push(newComment)
   
    Blog.findByIdAndUpdate(id, blog, { new: true }).populate('user')
    .then((updated) => {
        var collection = []
        updated.comment.forEach((c) => {
            collection.push(getBlogCommentInfo(c))
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

exports.removeBlogComment = async (req, res) => {
    const { parent_id, comment_id } = req.body

    let blog = await Blog.findById(parent_id).populate('user')

    if(!blog) return res.status(404).json({ variant: 'danger', message: err })

    const filtered = blog.comment.filter(comments => comments.id !== comment_id)

    blog.comment = filtered

    Blog.findByIdAndUpdate(parent_id, blog, { new: true }).populate('user')
    .then((updated) => {
        var collection = []
        updated.comment.forEach((c) => {
            collection.push(getBlogCommentInfo(c))
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

exports.countBlogCategories = async (req, res) => {
    const { id } = req.body

    var blogs = await Blog.find({}).sort({ createdAt: -1 }).populate('user')
    var categories = []

    if(id) {
        const user = await Users.findById(id)

        if(user.safe_content || user.safe_content === undefined)
            blogs = blogs.filter((item) => item.strict !== true)

        blogs = blogs.filter((item) => item.privacy !== true)

        if(blogs.length > 0) {
            blogs.forEach((item) => {
                categories.push(item.categories)
            })

            const counts = categories.reduce((acc, category) => {
                if (acc[category]) {
                acc[category]++;
                } else {
                acc[category] = 1;
                }
                return acc;
            }, {});
            
            const result = Object.entries(counts).map(([category, count]) => ({ category, count }));
            res.status(200).json({
                result: result
            })
        }
        else {
            res.status(404).json({ 
                message: "No available categories"
            })
        }
    }
    else {
        blogs = blogs.filter((item) => item.strict === false)
        blogs = blogs.filter((item) => item.privacy !== true)

        if(blogs.length > 0) {
            blogs.forEach((item) => {
                categories.push(item.categories)
            })

            const counts = categories.reduce((acc, category) => {
                if (acc[category]) {
                acc[category]++;
                } else {
                acc[category] = 1;
                }
                return acc;
            }, {});
            
            const result = Object.entries(counts).map(([category, count]) => ({ category, count }));

            res.status(200).json({
                result: result
            })
        }
        else {
            res.status(404).json({ 
                message: "No available categories"
            })
        }
    }
}

exports.addOneBlogViews = async (req, res) => {
    const { id, blogId } = req.body

    if(!blogId) return res.status(404).json({ variant: 'danger', message: 'invalid blogId' })

    try {
        let blog = await Blog.findById(blogId)

        let duplicate_id = false

        blog.views.some((item) => {
            if(item === id) {
                duplicate_id = true
                return true
            }
        })

        if(!duplicate_id) {
            blog.views.push(id)

            Blog.findByIdAndUpdate(blogId, blog, { new: true })
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
        return res.status(404).json({ variant: 'danger', message: 'invalid blogId' })
    }
}

exports.addOneBlogLikes = async (req, res) => {
    const { userId, id, likes } = req.body

    if(!id) return res.status(404).json({ variant: 'danger', message: 'invalid blogId' })

    try {
        Blog.findByIdAndUpdate(id, { likes: likes }, { new: true })
            .then(async () => {
                let blogs = await Blog.find({}).sort({ createdAt: -1 }).populate('user')

                if(userId) {
                    const user = await Users.findById(userId)

                    if(user.safe_content || user.safe_content === undefined)
                        blogs = blogs.filter((item) => item.strict !== true)

                    blogs = blogs.filter((item) => item.privacy !== true)

                    if(blogs.length > 0) {
                        res.status(200).json({ 
                            result: blogs
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
                        res.status(200).json({ 
                            result: blogs
                        })
                    }
                    else {
                        res.status(404).json({ 
                            message: "No available blogs"
                        })
                    }
                }
                res.status(200)
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