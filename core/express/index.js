const http = require('http')

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const busboy = require('connect-busboy')
const fileUpload = require('express-fileupload')
const morgan = require('morgan')
const helmet = require('helmet')

const config = require('../../config')
const router = require('../../routes')


const rawBodySaver = function (req, _res, buf, encoding) {
    if (buf && buf.length)req.rawBody = buf.toString(encoding || 'utf8');
}
const app = express()
app.use(express.static('.'));
app.use(cors())
app.use(bodyParser.json({limit: '50mb', verify: rawBodySaver}))
app.use(bodyParser.urlencoded({limit: '50mb', verify: rawBodySaver, extended: false}))
app.use(busboy())
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
    createParentPath: true
}))
app.use(morgan('dev'))
app.use(helmet())
app.use(router)

app.use(function(req, res, next){
    res.status(404);

    res.send({ status: false, message: 'Endpoint does not exist' });
    return;
})

const startAPI = () => {
    const server = http.createServer(app)
    server.listen(config.port, (err) => {
        if (err) {
            console.log(`API could not be start`, err)
            process.exit(-1)
        }
    })
}

module.exports = {
    startAPI
}
