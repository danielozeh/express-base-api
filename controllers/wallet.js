const User = require('../models/user')
const WalletTransaction = require('../models/walletTransaction')
const UserBank = require('../models/userBank')
const responseHandler = require('../utils/response')
const { verifyAccountNumber } = require('../services/paystack')

const verifyBankAccount = async(req, res) => {
    try {
        const user = req.user
        const { save } = req.query
        const {bank_code, account_number} = req.body
        const resolve = await verifyAccountNumber('account_number=' + account_number + '&bank_code=' + bank_code)
        if(resolve && resolve.data && resolve.status) {
            if(save == 1) {
                //add new bank here
                const add_bank = await UserBank.addBank({account_number: account_number, account_name: resolve.data.account_name, bank_code: bank_code, bank_name: resolve.data.bank_name, user_id: user._id})
                if(!add_bank) {
                    return responseHandler.sendError(res, add_bank)
                }
            }

            return responseHandler.sendSuccess(res, {
                message: 'Account verified successfully.',
                data: resolve.data
            })
        }
        return responseHandler.sendError(res, {
            message: 'Account number not resolved',
            status: 400
        })
    } catch(e) {
        return responseHandler.internalServerError(res)
    }
}

const removeBank = async(req, res) => {
    try {
        const user = req.user
        const { id } = req.params
        const user_id = user._id
        const remove_bank = await UserBank.removeBank(id, user_id)
        if(remove_bank.status) {
            return responseHandler.sendSuccess(res, remove_bank)
        }
        return responseHandler.sendError(res, remove_bank)
    } catch(e) {
        return responseHandler.internalServerError(res)
    }
}

const myBanks = async(req, res) => {
    try {
        const user = req.user
        const user_id = user._id
        const all_banks = await UserBank.myBanks(user_id)
        if(all_banks.status) {
            return responseHandler.sendSuccess(res, all_banks)
        }
        return responseHandler.sendError(res, all_banks)
    } catch(e) {
        return responseHandler.internalServerError(res)
    }
}

const withdrawToBank = async(req, res) => {
    try {
        const user = req.user
        const user_id = user._id
        const { bank_id, amount, pin } = req.body
        //withdraw to bank
        const withdraw = await WalletTransaction.withdrawToBank(user_id, bank_id, amount, pin)
        if(withdraw.status) {
            return responseHandler.sendSuccess(res, withdraw)
        }
        return responseHandler.sendError(res, withdraw)
    } catch(e) {
        return responseHandler.internalServerError(res)
    }
}

const transferWebhook = async(req, res) => {
    const { event, data } = req.body
    try {
        //find transaction by transaction_id
        const transaction = await WalletTransaction.findByTransactionID(data.transfer_code)
        if(!transaction.status) {
            return responseHandler.sendError(res, transaction)
        }
        const transaction_id = transaction.data.transaction_id
        const status = transaction.data.status
        let update_transaction = ''
        if(status === 'pending') {
            if(event === 'transfer.success') {
                //update transaction to success
                update_transaction = await WalletTransaction.updateTransactionStatus(transaction_id, status = 'success')
                if(update_transaction.status) {
                    return responseHandler.sendSuccess(res, update_transaction)
                }
            }
            
            if(event === 'transfer.failed') {
                update_transaction = await WalletTransaction.updateTransactionStatus(transaction_id, status = 'failed')
                if(update_transaction.status) {
                    return responseHandler.sendSuccess(res, update_transaction)
                }
            }

            if(event === 'transfer.reversed') {
                update_transaction = await WalletTransaction.updateTransactionStatus(transaction_id, status = 'reversed')
                if(update_transaction.status) {
                    return responseHandler.sendSuccess(res, update_transaction)
                }
            }
        }
    } catch(error) {
        return responseHandler.internalServerError(res)
    }
}

const walletHistory = async(req, res) => {
    try {
        const user = req.user
        const user_id = user._id
        const { page, limit, transaction_type } = req.query
        const pageOptions = {
            sort: { created_at: -1 },
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 25,
            lean: true,
            populate: [
                { 
                    path: 'recipient.user',
                    select: '_id email full_name is_active is_verified created_at updated_at country bio specialisation display_name'
                }
            ],
        }
        let query = {'recipient.user': user_id}
        if(transaction_type) {
            query['recipient.transaction_type'] = transaction_type
        }
        const wallet_history = await WalletTransaction.userWalletHistory(query, pageOptions)
        if(wallet_history.status) {
            return responseHandler.sendSuccess(res, wallet_history)
        }
        return responseHandler.sendError(res, wallet_history)
    } catch(e) {
        return responseHandler.internalServerError(res)
    }
}

const bankList = async (req, res) => {
    const user = req.user
    let allBanks = new BankList
    return responseHandler.sendSuccess(res, {
        message: 'All Banks.',
        data: allBanks.allBanks
    });
}

module.exports = {
    verifyBankAccount,
    removeBank,
    myBanks,
    withdrawToBank,
    transferWebhook,
    walletHistory
}