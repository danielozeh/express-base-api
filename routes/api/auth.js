const express = require('express')
const router = express.Router()
const validate = require('../../middlewares/validate')
const auth = require('../../middlewares/authenticate')
const { register, resendCode, verify, login, forgotPassword, resetPassword } = require('../../validations/auth');

const authController = require('../../controllers/auth')

//POST REQUESTS
router.post('/register', validate(register), authController.register);
router.post('/verification/resend', validate(resendCode), authController.resendVerificationCode)
router.post('/account/verify', validate(verify), authController.verifyAccount)
router.post('/login', validate(login), authController.login)
router.post('/password/forgot', validate(forgotPassword), authController.forgotPassword)
router.post('/password/reset', validate(resetPassword), authController.resetPassword)

//GET REQUESTS

//PUT REQUESTS

//DELETE REQUESTS

module.exports = router