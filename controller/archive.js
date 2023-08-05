const Archive         = require('../models/archive.model')
const ArchiveName     = require('../models/archiveName.model')

exports.getArchiveNameById = async (req, res) => {
    const { id } = req.body
    var archives = await ArchiveName.find({ user: id })

    try {
        if(archives.length > 0) {
            res.status(200).json({ 
                result: archives
            })
        }
        else {
            var defaultArchives = [
                {
                    user: id,
                    archive_name: "Videos"
                },
                {
                    user: id,
                    archive_name: "Blogs"
                },
                {
                    user: id,
                    archive_name: "Games"
                },
                {
                    user: id,
                    archive_name: "Software"
                }
            ]

            ArchiveName.insertMany(defaultArchives)
            .then((result) => {
                res.status(200).json({ 
                    result: result
                })
            })
        } 
    }
    catch (err) {
        console.log(err)
        res.status(404).json({ 
            message: "No available data"
        })
    }
}

exports.newArchiveList = async (req, res) => {
    const { id, archive_id, archive_list } = req.body

    if(!id && !archive_id) return res.status(404).json({ 
        variant: 'danger',
        message: "Error 403: Unauthorized Request"
    });

    ArchiveName.findByIdAndUpdate(archive_id, { archive_list: archive_list}, { new: true })
    .then(async (result) => {
        var archives = await ArchiveName.find({ user: id })
        try {
            if(archives.length > 0) {
                res.status(200).json({ 
                    result: archives,
                    sideAlert: {
                        variant: "success",
                        heading: `Added to Archive ${result.archive_name}`,
                        paragraph: "You can view this in your archive"
                    }
                })
            }
            else {
                var defaultArchives = [
                    {
                        user: id,
                        archive_name: "Videos"
                    },
                    {
                        user: id,
                        archive_name: "Blogs"
                    },
                    {
                        user: id,
                        archive_name: "Games"
                    },
                    {
                        user: id,
                        archive_name: "Software"
                    }
                ]

                ArchiveName.insertMany(defaultArchives)
                .then((result) => {
                    res.status(200).json({ 
                        result: result,
                        sideAlert: {
                            variant: "success",
                            heading: `Added to Archive ${result.archive_name}`,
                            paragraph: "You can view this in your archive"
                        }
                    })
                })
            } 
        }
        catch (err) {
            console.log(err)
            res.status(404).json({ 
                message: "No available data"
            })
        }
    })
    .catch((err) => {
        console.log(err)
        res.status(404).json({ 
            message: "Failed to Update"
        })
    })
}

exports.removeArchiveList = async (req, res) => {
    const { id, archive_id, archive_list, archive_name } = req.body

    if(!id && !archive_id) return res.status(404).json({ 
        variant: 'danger',
        message: "Error 403: Unauthorized Request"
    });

    ArchiveName.findByIdAndUpdate(archive_id, { archive_list: archive_list}, { new: true })
    .then(async (result) => {
        var archives = await ArchiveName.find({ user: id })
        try {
            if(archives.length > 0) {
                res.status(200).json({ 
                    result: archives,
                    sideAlert: {
                        variant: "warning",
                        heading: `Sub archive ${archive_name} deleted`,
                        paragraph: "successfully deleted"
                    }
                })
            }
            else {
                var defaultArchives = [
                    {
                        user: id,
                        archive_name: "Videos"
                    },
                    {
                        user: id,
                        archive_name: "Blogs"
                    },
                    {
                        user: id,
                        archive_name: "Games"
                    },
                    {
                        user: id,
                        archive_name: "Software"
                    }
                ]

                ArchiveName.insertMany(defaultArchives)
                .then((result) => {
                    res.status(200).json({ 
                        result: result,
                        sideAlert: {
                            variant: "warning",
                            heading: `Sub archive ${archive_name} deleted`,
                            paragraph: "successfully deleted"
                        }
                    })
                })
            } 
        }
        catch (err) {
            console.log(err)
            res.status(404).json({ 
                message: "No available data"
            })
        }
    })
    .catch((err) => {
        console.log(err)
        res.status(404).json({ 
            message: "Failed to Update"
        })
    })
}