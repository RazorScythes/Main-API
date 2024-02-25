const Project                   = require('./models/projects.model')

exports.updateGoogledriveID = async () => {
    const projects = await Project.find({})
    projects.forEach(async (item) => {
        // if(item.featured_image.split('id=')[1]) {
            const updatedProject = await Project.findByIdAndUpdate(item._id, {featured_image: 'https://drive.google.com/uc?export=view&id='+item.featured_image}, { new: true })
            console.log(`Project ${item._id} updated successfully.`);
        // }
    })
}