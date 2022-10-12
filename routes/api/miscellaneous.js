const express = require('express')
const router = express.Router()
const auth = require('../../middlewares/authenticate')

const userController = require('../../controllers/user')

//POST REQUESTS

//GET REQUESTS
router.get('/socials', auth, userController.supportedSocials);

//PUT REQUESTS

//DELETE REQUESTS

module.exports = router