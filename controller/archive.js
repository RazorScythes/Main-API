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
                    archive_name: "Videos",
                    bg_color: '#CD3242',
                    icon_bg_color: '#CD3242',
                    icon_color: '#FFFFFF',
                    icon: 'fa-video'
                },
                {
                    user: id,
                    archive_name: "Blogs",
                    bg_color: '#0DCAF0',
                    icon_bg_color: '#0DCAF0',
                    icon_color: '#FFFFFF',
                    icon: 'fa-note-sticky'
                },
                {
                    user: id,
                    archive_name: "Games",
                    bg_color: '#15CA20',
                    icon_bg_color: '#15CA20',
                    icon_color: '#FFFFFF',
                    icon: 'fa-gamepad'
                },
                {
                    user: id,
                    archive_name: "Software",
                    bg_color: '#FFC20D',
                    icon_bg_color: '#FFC20D',
                    icon_color: '#FFFFFF',
                    icon: 'fa-computer'
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

exports.getArchiveDataById = async (req, res) => {
    const { id, archive } = req.body

    if(!id || !archive) return res.status(404).json({ variant: 'danger', message: "archive not found", notFound: true })
    
    var archive_name = await ArchiveName.findOne({ user: id, archive_name: archive })
    var content_type_list = []

    if(archive_name) {
        var archives = await Archive.find({ user: id, archive_name: archive_name._id, content_type: archive }).populate('archive_name')
        
        archives.forEach((item) => {
            content_type_list.push(item.directory_name)
        })

        const counts = content_type_list.reduce((acc, items) => {
            if (acc[items]) {
            acc[items]++;
            } else {
            acc[items] = 1;
            }
            return acc;
        }, {});
        
        const result = Object.entries(counts).map(([name, items]) => ({ name, items }));

        result.forEach((item) => {
            archive_name.archive_list.forEach((a, i) => {
                if(item.name === a.name) {
                    archive_name.archive_list[i].items = item.items
                }
                else {
                    archive_name.archive_list[i].items = 0
                }
            })
        })

        res.status(200).json({ result: archive_name })
    }
    else {
        return res.status(404).json({ variant: 'danger', message: "archive not found", notFound: true })
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
                        archive_name: "Videos",
                        bg_color: '#CD3242',
                        icon_bg_color: '#CD3242',
                        icon_color: '#FFFFFF',
                        icon: 'fa-video'
                    },
                    {
                        user: id,
                        archive_name: "Blogs",
                        bg_color: '#0DCAF0',
                        icon_bg_color: '#0DCAF0',
                        icon_color: '#FFFFFF',
                        icon: 'fa-note-sticky'
                    },
                    {
                        user: id,
                        archive_name: "Games",
                        bg_color: '#15CA20',
                        icon_bg_color: '#15CA20',
                        icon_color: '#FFFFFF',
                        icon: 'fa-gamepad'
                    },
                    {
                        user: id,
                        archive_name: "Software",
                        bg_color: '#FFC20D',
                        icon_bg_color: '#FFC20D',
                        icon_color: '#FFFFFF',
                        icon: 'fa-computer'
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
                        archive_name: "Videos",
                        bg_color: '#CD3242',
                        icon_bg_color: '#CD3242',
                        icon_color: '#FFFFFF',
                        icon: 'fa-video'
                    },
                    {
                        user: id,
                        archive_name: "Blogs",
                        bg_color: '#0DCAF0',
                        icon_bg_color: '#0DCAF0',
                        icon_color: '#FFFFFF',
                        icon: 'fa-note-sticky'
                    },
                    {
                        user: id,
                        archive_name: "Games",
                        bg_color: '#15CA20',
                        icon_bg_color: '#15CA20',
                        icon_color: '#FFFFFF',
                        icon: 'fa-gamepad'
                    },
                    {
                        user: id,
                        archive_name: "Software",
                        bg_color: '#FFC20D',
                        icon_bg_color: '#FFC20D',
                        icon_color: '#FFFFFF',
                        icon: 'fa-computer'
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