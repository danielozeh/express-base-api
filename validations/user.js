const Joi = require('joi')

module.exports = {

    editProfile: Joi.object({
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        bio: Joi.string().required(),
        phone_number: Joi.string().required(),
    }),

    createPin: Joi.object({
        pin: Joi.string().required(),
    }),

    changePassword: Joi.object({
        old_password: Joi.string().required(),
        new_password: Joi.string().required()
    }),

    changePin: Joi.object({
        old_pin: Joi.string().required(),
        new_pin: Joi.string().required()
    })
}
