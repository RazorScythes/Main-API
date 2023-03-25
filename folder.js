const fs = require('fs-extra');

exports.initFolders = (arr) => {
    arr.forEach((path) => {
        let dir = path;
        fs.ensureDirSync(dir);
    })
}