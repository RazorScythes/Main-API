const Users                 = require('../models/user.model')
const Video                 = require('../models/video.model')
const Game                  = require('../models/games.model')
const Blog                  = require('../models/blogs.model')
const ActivityLogs          = require('../models/activityLogs.model') 

exports.getOverviewData = async (req, res) => {
    try {
        const users_count = await Users.countDocuments({});
        const video_count = await Video.countDocuments({});
        const games_count = await Game.countDocuments({});
        const blogs_count = await Blog.countDocuments({});

        const latest_user   = await Users.findOne().sort({ createdAt: -1 }).select('createdAt');
        const latest_video  = await Video.findOne().sort({ createdAt: -1 }).select('createdAt');
        const latest_game   = await Game.findOne().sort({ createdAt: -1 }).select('createdAt');
        const latest_blog   = await Blog.findOne().sort({ createdAt: -1 }).select('createdAt');
        
        const users_data = await Users.find({}).limit(10).select('avatar role username');

        const users = await Promise.all(users_data.map(async (user) => {
            const blogsCount = await Blog.countDocuments({ user: user._id });
            const videosCount = await Video.countDocuments({ user: user._id });
            const gamesCount = await Game.countDocuments({ user: user._id });

            return {
                ...user.toObject(),
                points: blogsCount + videosCount + gamesCount
            };
        }));

        const activity_logs = await ActivityLogs.find({}).populate({
            path: 'user',
            select: 'username avatar'
        }).sort({ createdAt: -1 })

        res.status(200).json({ 
            users_count: { users_count, latest_user },
            video_count: { video_count, latest_video },
            games_count: { games_count, latest_game },
            blogs_count: { blogs_count, latest_blog },
            users,
            activity_logs
        })
    }
    catch(err) {
        console.log(err)
        return res.status(404).json({ variant: 'danger', message: 'data not found', notFound: true })
    }
}