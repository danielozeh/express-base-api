const express = require('express')
const router = express.Router()
const validate = require('../../middlewares/validate')
const auth = require('../../middlewares/authenticate')
const isInfluencer = require('../../middlewares/isInfluencer')
const isPinCreated = require('../../middlewares/isPinCreated')
const { verifyBankAccount, withdrawToBank } = require('../../validations/wallet');

const walletController = require('../../controllers/wallet')

//POST REQUESTS
router.post('/bank', auth, isInfluencer(), validate(verifyBankAccount), walletController.verifyBankAccount)
router.post('/withdraw', auth, isInfluencer(), isPinCreated(), validate(withdrawToBank), walletController.withdrawToBank)

//GET REQUESTS
router.get('/bank', auth, isInfluencer(), walletController.myBanks)
router.get('/', auth, walletController.walletHistory)

//PUT REQUESTS

//DELETE REQUESTS
router.delete('/bank/:id', auth, isInfluencer(), walletController.removeBank)

module.exports = router