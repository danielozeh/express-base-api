const mongoose = require('mongoose')
const config = require('../../config')

const URI = config.mongoURL;
const OPTIONS = {
    replicaSet: config.mongoReplicaSet,
    useNewUrlParser: true,
    maxPoolSize: 2,
    socketTimeoutMS: 600000, //kill idle connections after 10 minutes
    useUnifiedTopology: true
}

const connection = mongoose.createConnection(URI, OPTIONS);

connection.on('connected', () => {
    console.log(`API-DB Ready!`)
})

connection.on('disconnected', (err) => {
    console.log(`API-DB disconnect from MongoDB via Mongoose because of ${err}`)
})

connection.on('error', (err) => {
    console.log(`Could not connect to API-DB because of ${err}`)
    process.exit(-1)
})

module.exports = {
    connection,
    mongoose
};
