const fs = require('fs')
const cloudinary = require('cloudinary')

const config = require('../../config')

class cloudinaryStorage {
    async uploadFile(file, folder = 'user') {
        try {
            cloudinary.config({ 
                cloud_name: config.cloudinary.cloud_name, 
                api_key: config.cloudinary.api_key, 
                api_secret: config.cloudinary.api_secret 
            });

            return cloudinary.v2.uploader.upload(file, {folder: folder})
            .then(data => {
                return data
            })
            return false

        } catch (err) {
            return Promise.reject(err);
        }
    }
}

module.exports = new cloudinaryStorage()