const responseHandler = require('../utils/response')
const isPinCreated =  (joi, body = 'body') => {
    return async (req, res, next) => {
        try {
            const user = req.user
            if(user.is_pin_created) {
                next()
                return
            }
            return responseHandler.sendError(res, {
                message: 'Pin not created',
                status_code: 401,
                data: 'pin_not_created'
            })
        }catch (e) {
            return responseHandler.sendError(res, {
                message: 'User pin not created',
                status: 401
            })
        }
    }
}

module.exports = isPinCreated;