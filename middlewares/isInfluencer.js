const responseHandler = require('../utils/response')
const isInfluencer =  (joi, body = 'body') => {
    return async (req, res, next) => {
        try {
            const user = req.user
            if(user.user_type == 'influencer') {
                next()
                return
            }
            return responseHandler.sendError(res, {
                message: 'Only influencers can access this resource',
                status_code: 401,
                data: 'kyc'
            })
        }catch (e) {
            return responseHandler.sendError(res, {
                message: 'Failed to get user type',
                status: 401
            })
        }
    }
}

module.exports = isInfluencer;