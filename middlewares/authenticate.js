const jwt = require('jsonwebtoken')
const User = require('../models/user')
const config = require('../config')
const auth = async (req, res, next) => {
    const authorization = req.header('Authorization')
    if (authorization) {
        try {
            let token = authorization.replace('Bearer ', '').trim()
            let data = jwt.verify(token, config.secret)
            let user = await User.findById(data.id).lean()
            if(user) {
                user['is_pin_created'] = false
                if(user.pin && user.pin != "" ) {
                    user['is_pin_created'] = true
                }
                delete user.password
                delete user.pin
                req.user = user
                return next()
            }
            return res.status(403).send({
                status: false,
                message: 'Invalid user token',
                data: null
            })
        }catch (e) {
            return res.status(401).send({
                status: false,
                message: 'Invalid token',
            })
        }
    } else {

        return res.status(401).send({
            status: false,
            message: 'No authorization token.',
        })
    }
}

module.exports = auth;