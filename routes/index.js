const express = require('express')

const router = express.Router()

router.get('/', (req, res) => {
    return res.send(`<h1>Welcome to Danoice Limited v1.0.docs</a>.`)
})

router.get('/v1', (req, res) => {
    return res.send(`<h1>Welcome to Danoice Limited v1.0.</h1>docs</a>`)
})

const authRoutes = require('./api/auth')
const userRoutes = require('./api/user')
const miscellaneousRoutes = require('./api/miscellaneous')
const walletRoutes = require('./api/wallet')

router.use('/v1/auth', authRoutes)
router.use('/v1/user', userRoutes)
router.use('/v1', miscellaneousRoutes)
router.use('/v1/wallet', walletRoutes)


module.exports = router