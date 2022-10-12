const Joi = require('joi')

module.exports = {

    verifyBankAccount: Joi.object({
        account_number: Joi.string().required(),
        bank_code: Joi.string().required(),
    }),

    withdrawToBank: Joi.object({
        bank_id: Joi.string().required(),
        amount: Joi.number().required(),
        pin: Joi.string().required()
    })
}
