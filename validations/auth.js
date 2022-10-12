const Joi = require('joi')

const User = require('../models/user')

const check = async (email) => {
    const user = await User.findOne({email}).exec()
    if (user) {
        throw Error('email already exists.')
    }
}

module.exports = {
    register: Joi.object({
        email: Joi.string().email().external(check).required(),
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        password: Joi.string().required()
    }),

    resendCode: Joi.object({
        email: Joi.string().email().required()
    }),

    verify: Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.string().required()
    }),

    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    forgotPassword: Joi.object({
        email: Joi.string().email().required()
    }),

    resetPassword: Joi.object({
        email: Joi.string().email().required(),
        token: Joi.string().required(),
        password: Joi.string().required()
    }),
}
