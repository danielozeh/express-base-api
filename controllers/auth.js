const User = require('../models/user')
const responseHandler = require('../utils/response')

const register = async(req, res) => {
    try {
        const payload = req.body
        const create_new_account = await User.createNewAccount(payload)
        if(create_new_account.status) {
            return responseHandler.sendSuccess(res, create_new_account)
        }
        return responseHandler.sendError(res, create_new_account)
    }
    catch(e) {
        return responseHandler.internalServerError(res)
    }
}


const resendVerificationCode = async(req, res) => {
    try {
        const {email} = req.body
        const send_code = await User.resendVerificationCode(email)
        if(send_code.status) {
            return responseHandler.sendSuccess(res, send_code)
        }
        return responseHandler.sendError(res, send_code)
    } catch(e) {
        return responseHandler.internalServerError(res)
    }
}

const verifyAccount = async(req, res) => {
    try {
        const {email, otp} = req.body
        const verify_account = await User.verifyAccount(email, otp)
        if(verify_account.status) {
            return responseHandler.sendSuccess(res, verify_account)
        }
        return responseHandler.sendError(res, verify_account)
    } catch(e) {
        return responseHandler.internalServerError(res)
    }
}

const login = async(req, res) => {
    try {
        const {email, password} = req.body
        const login_user = await User.login(email, password)
        if(login_user.status) {
            return responseHandler.sendSuccess(res, login_user)
        }
        return responseHandler.sendError(res, login_user)
    } catch(e) {
        return responseHandler.internalServerError(res)
    }
}

const forgotPassword = async(req, res) => {
    try {
        const {email} = req.body
        const forgot_password = await User.forgotPassword(email)
        if(forgot_password.status) {
            return responseHandler.sendSuccess(res, forgot_password)
        }
        return responseHandler.sendError(res, forgot_password)
    } catch(e) {
        return responseHandler.internalServerError(res)
    }
}

const resetPassword = async(req, res) => {
    try {
        const {email, token, password} = req.body
        const reset_password = await User.resetPassword(email, token, password)
        if(reset_password.status) {
            return responseHandler.sendSuccess(res, reset_password)
        }
        return responseHandler.sendError(res, reset_password)
    } catch(e) {
        return responseHandler.internalServerError(res)
    }
}

module.exports = {
    register,
    resendVerificationCode,
    verifyAccount,
    login,
    forgotPassword,
    resetPassword
}