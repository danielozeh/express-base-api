const User = require('../models/user')
const responseHandler = require('../utils/response')
const {handleFileUpload} = require('../utils/uploads')

const profile = async(req, res) => {
    try {
        const user = req.user
        return responseHandler.sendSuccess(res, {
            message: 'Profile Information',
            data: user
        })
    } catch(e) {
        return responseHandler.internalServerError(res)
    }
}

const editProfile = async(req, res) => {
    try {
        const { first_name, last_name, bio, phone_number } = req.body
        const user = req.user
        const user_id = user._id

        const edit_profile = await User.editProfile({user_id, first_name, last_name, bio, phone_number})
        if(edit_profile.status) {
            return responseHandler.sendSuccess(res, edit_profile)
        }
        return responseHandler.sendError(res, edit_profile)
    } catch(e) {
        return responseHandler.internalServerError(res)
    }
}

const updateAvatar = async(req, res) => {
    try {
        const user = req.user
        const user_id = user._id
        if(!req.files || !req.files.avatar) {
            return responseHandler.sendError(res, {
                message: 'Avatar is required'
            })
        }
        let {avatar} = req.files
        let uploadAvatar = await handleFileUpload(avatar, folder = 'users')
        if(!uploadAvatar) {
            return responseHandler.sendError(res,{
                message: 'Failed to upload avatar'
            })
        }
        avatar = uploadAvatar.url
        const update_avatar = await User.updateAvatar(user_id, avatar)
        if(update_avatar.status) {
            return responseHandler.sendSuccess(res, update_avatar)
        }
        return responseHandler.sendError(res, update_avatar)
    } catch(e) {
        return responseHandler.internalServerError(res)
    }
}

const createPin = async (req, res) => {
    const { pin } = req.body
    const user = req.user
    const user_id = user._id
    try {
        const create_pin = await User.createPin(user_id, pin)
        if(create_pin.status) {
            return responseHandler.sendSuccess(res, create_pin)
        }
        return responseHandler.sendError(res, create_pin)
    } catch(e) {
        return responseHandler.internalServerError(res)
    }
}

const changePassword = async (req, res) => {
    try {
        let user = req.user 
        const user_id = user._id
        let {old_password, new_password} = req.body
        const change_password = await User.changePassword(user_id, old_password, new_password)
        if(change_password.status) {
            return responseHandler.sendSuccess(res, change_password)
        }
        return responseHandler.sendError(res, change_password)
    } catch(e) {
        return responseHandler.internalServerError(res)
    }
}

const changePin = async (req, res) => {
    try {
        let user = req.user 
        const user_id = user._id
        let {old_pin, new_pin} = req.body
        const change_pin = await User.changePin(user_id, old_pin, new_pin)
        if(change_pin.status) {
            return responseHandler.sendSuccess(res, change_pin)
        }
        return responseHandler.sendError(res, change_pin)
    } catch(e) {
        return responseHandler.internalServerError(res)
    }
}

const forgotPin = async(req, res) => {
    try {
        const {email} = req.body
        const forgot_pin = await User.forgotPin(email)
        if(forgot_pin.status) {
            return responseHandler.sendSuccess(res, forgot_pin)
        }
        return responseHandler.sendError(res, forgot_pin)
    } catch(e) {
        return responseHandler.internalServerError(res)
    }
}

const resetPin = async(req, res) => {
    try {
        const {email, token, pin} = req.body
        const reset_pin = await User.resetPin(email, token, password)
        if(reset_pin.status) {
            return responseHandler.sendSuccess(res, reset_pin)
        }
        return responseHandler.sendError(res, reset_pin)
    } catch(e) {
        return responseHandler.internalServerError(res)
    }
}

module.exports = {
    profile,
    editProfile,
    updateAvatar,
    createPin,
    changePassword,
    changePin,
    forgotPin,
    resetPin
}