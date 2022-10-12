const path = require('path')
const os = require('os')
const cloudinary = require('./cloudinary/storage')
const fs = require('fs');
const slug = string => {
    //return string.toLowerCase().replace(/\s+/g, '-').trim()
    return string.toString()
        .normalize('NFKC').toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
}
const handleFileUpload = async (file, folder = 'user', name = 'danoicefiles') => {
    const ext = path.extname(file.name)

    let filename = file.md5
    filename = filename + '-' + Date.now() + ext
    const filePath = path.join(os.tmpdir(), name, filename)
    await file.mv(filePath, err => {
        if (err) {
            return 'something went wrong'
        }
    })
    //const upload = await s3.uploadFile(filename, filePath, name)
    const upload = await cloudinary.uploadFile(filePath, folder)
    fs.unlink(filePath, (err) => {
        console.log('err', err)
    })
    /*return {
        originalname: file.name,
        name: filename,
        url: upload.Location,
        key: upload.key,
        size: file.size,
        mime: file.mimetype
    }*/
    return {
        originalname: file.name,
        name: filename,
        url: upload.url,
        key: upload.asset_id,
        size: file.size,
        mime: file.mimetype
    }
}

module.exports = { handleFileUpload }
