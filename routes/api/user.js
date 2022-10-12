const express = require('express')
const router = express.Router()
const validate = require('../../middlewares/validate')
const auth = require('../../middlewares/authenticate')
const { editProfile, createPin, changePassword, changePin } = require('../../validations/user');

const userController = require('../../controllers/user')

//POST REQUESTS
router.post('/profile/avatar/update', auth, userController.updateAvatar)
router.post('/pin', auth, validate(createPin), userController.createPin)

//GET REQUESTS
router.get('/', auth, userController.profile);

//PUT REQUESTS
router.put('/profile', auth, validate(editProfile), userController.editProfile)
router.put('/password/change', auth, validate(changePassword), userController.changePassword)
router.put('/pin/change', auth, validate(changePin), userController.changePin)

//DELETE REQUESTS

module.exports = router