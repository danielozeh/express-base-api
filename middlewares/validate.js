const responseHandler = require('../utils/response')

const validate =  (joi, body = 'body') => {
    return async (req, res, next) => {
        try {
            const {error} = await joi.validateAsync(req[body], {abortEarly: false, allowUnknown: true})
            const valid = error == null
            if (valid) {
                next()
            } else {
                const {details} = error
                const message = details.map(i => i.message && i.message.replace(/['"]/g, '').replace(/mongo/g, '')).join(' and ')
                return responseHandler.sendError(res, {message, status_code: 403})
            }
        }catch (e) {
            const {details} = e
            const message = (details) ? details.map(i => i.message && i.message.replace(/['"]/g, '').replace(/mongo/g, '')).join(' and ') : ((e.message) ? e.message : "An error occurred while creating address");
            return responseHandler.sendError(res, {
                message,
                status_code: 403
            })
        }
    }
}

module.exports = validate;