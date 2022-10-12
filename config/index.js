require('dotenv').config()

module.exports = {
    appName: process.env.APP_NAME || 'Danoice Limited',
    env: process.env.NODE_ENV,
    secret: process.env.APP_SECRET,
    port: process.env.PORT,
    mongoURL: process.env.MONGO_URL,
    mongoReplicaSet: process.env.MONGO_REPLICA_SET,
    amqp: {
        url: process.env.CLOUDAMQP_URL
    },
    firebase: {
    },
    redis: {
        url: process.env.REDIS_URL,
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
    },
    imagePath: {},
    cloudinary: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    },
    paystack: {
        secret: process.env.PAYSTACK_SECRET_KEY
    }
}
