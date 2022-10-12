const { connection, mongoose } = require('../core/db')
const { Schema, Types : { ObjectId, Map }} = mongoose;
const mongoosePaginate = require('mongoose-paginate-v2');
const transaction_types = ['received', 'withdrawal', 'reversed']
const statuses = ['success', 'failed', 'pending']
const User = require('./user');
const UserBank = require('./userBank');
const {paystack} = require('../services/paystack')
const {Strings} = require('../utils/strings')
const Paginator = require('../utils/paginator')

const WalletTransactionSchema = new Schema({
    amount: {
        type: Number,
        required: [true, 'amount is required']
    },
    balance: {
        type: Number,
        required: false,
    },
    fee: {
        type: Number,
        required: false,
        default: 0.00
    },
    metadata: {
        type: Object,
        default: {}
    },
    transaction_id: {
        type: String,
        required: false
    },
    recipient: {
        user: {
            type: ObjectId,
            ref: 'User'
        },
        transaction_type: {
            type: String,
            enum: transaction_types
        }
    },
    sender: {
        user: {
            type: ObjectId,
            ref: 'User'
        },
        transaction_type: {
            type: String,
            enum: transaction_types
        }
    },
    status: {
        type: String,
        enum: statuses,
        default: 'success'
    }
}, {
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at', deleted_at: 'deleted_at'}
})

WalletTransactionSchema.statics = {
    withdrawToBank: async(user_id, bank_id, amount, pin) => {
        //get user profile
        const user = await User.userUnleanedProfile(user_id)
        if(!user.status) {
            return { status: false, message: 'Account does not exist' }
        }
        //get user balance
        const user_balance = (user.data.wallet_balance) ? user.data.wallet_balance : 0.00
        if(Number(amount) > Number(user_balance)) {
            return { status: false, message: 'Insufficient wallet balance' }
        }
        //check if pin is valid
        const is_pin = await User.verifyUserPin(pin, user.data.pin)
        if(!is_pin) {
            return { status: false, message: 'Invalid pin' }
        }

        const find_bank = await UserBank.findBank(bank_id)
        if(!find_bank.status) {
            return find_bank
        }
        const bank_details = find_bank.data
        if(String(bank_details.user_id) != String(user_id)) {
            return { status: false, message: 'User cannot use selected bank' }
        }

        //hit paystack endpoint to arrange withdrawals
        const params = {
            type: 'nuban',
            name: bank_details.account_name,
            account_number: bank_details.account_number,
            bank_code: bank_details.bank_code,
            currency: "NGN"
        }
        const payment = await paystack.post('transferrecipient', params)
            .then(({data})=> data)
            .catch(({response}) => response)
            
        if(payment.status) {
            //initiate the transfer
            const transfer = await paystack.post('transfer', { source: 'balance', amount: amount * 100, recipient: payment.data.recipient_code, reason: `Wallet Withdrawal of ${params.currency}${amount} ` })
                .then(({data})=> data)
                .catch(({response}) => response)
            
            if(transfer.status && transfer.data.status === 'pending') {
                //deduct amount from wallet
                const new_balance = Number(user_balance) - Number(amount)
                await User.findByIdAndUpdate(user_id, {
                    $inc: {wallet_balance: Number(-amount)},
                })
                delete bank_details.user_id
                delete bank_details.created_at
                delete bank_details.updated_at
                delete bank_details.__v
                delete bank_details._id
                const withdraw = await WalletTransaction.create({
                    sender: {
                        user: null,
                    },
                    recipient: {
                        user: user_id,
                        transaction_type: 'withdrawal'
                    },
                    balance: Number(new_balance),
                    amount: Number(amount),
                    status: 'pending',
                    transaction_id: transfer.data.transfer_code,
                    metadata: bank_details
                });
                return { status: true, message: 'Withdrawal in progress', data: withdraw }
            }
            return { status: false, message: 'Failed to initiate transfer request' }
        }
        return { status: false, message: 'Failed to place withdrawal request' }
    },

    findByTransactionID: async(transaction_id) => {
        const transaction = await WalletTransaction.findOne({transaction_id})
        if(transaction) {
            return { status: true, message: 'Transaction info', data: transaction }
        }
        return { status: false, message: 'Transaction not found' }
    },

    updateTransactionStatus: async(transaction_id, transaction_status) => {
        let update_transaction = ''
        switch (transaction_status) {
            case 'success':
                update_transaction = await WalletTransaction.findOneAndUpdate({transaction_id}, {status: 'success'})
                if(update_transaction) {
                    return { status: true, message: 'Transaction updated successfully', data: update_transaction }
                }
                return { status: false, message: 'Failed to update transaction' }
                break;

            case 'failed':
                update_transaction = await WalletTransaction.findOneAndUpdate({transaction_id}, {status: 'failed'})
                if(update_transaction) {
                    //get user info
                    const user_id = update_transaction.recipient.user
                    const user = await User.userUnleanedProfile(user_id)
                    const user_balance = (user.data.wallet_balance) ? user.data.wallet_balance : 0.00
                    const new_balance = Number(user_balance) + Number(update_transaction.amount)
                    //reverse transaction
                    await WalletTransaction.create({
                        sender: {
                            user: null,
                        },
                        recipient: {
                            user: user_id,
                            transaction_type: 'reversed'
                        },
                        balance: Number(new_balance),
                        amount: Number(update_transaction.amount),
                        status: 'success',
                        transaction_id: Strings.generateRandomKey(10)
                    });
                    return { status: true, message: 'Transaction updated successfully', data: update_transaction }
                }
                return { status: false, message: 'Failed to update transaction' }
                break;

            case 'reversed':
                update_transaction = await WalletTransaction.findOneAndUpdate({transaction_id}, {status: 'failed'})
                if(update_transaction) {
                    //get user info
                    const user_id = update_transaction.recipient.user
                    const user = await User.userUnleanedProfile(user_id)
                    const user_balance = (user.data.wallet_balance) ? user.data.wallet_balance : 0.00
                    const new_balance = Number(user_balance) + Number(update_transaction.amount)
                    //reverse transaction
                    await WalletTransaction.create({
                        sender: {
                            user: null,
                        },
                        recipient: {
                            user: user_id,
                            transaction_type: 'reversed'
                        },
                        balance: Number(new_balance),
                        amount: Number(update_transaction.amount),
                        status: 'success',
                        transaction_id: Strings.generateRandomKey(10)
                    });
                    return { status: true, message: 'Transaction updated successfully', data: update_transaction }
                }
                return { status: false, message: 'Failed to update transaction' }
                break;
        
            default:
                break;
        }
    },

    userWalletHistory: async(query = {}, pageOptions = {}) => {
        const wallet_history = await WalletTransaction.paginate(query, pageOptions)
        if(wallet_history) {
            return { status: true, messaage: 'Wallet history', data: { wallet_history: wallet_history.docs, pagination: Paginator.build(wallet_history) } }
        }
        return { status: false, message: 'Failed to fetch wallet history' }
    }
}

WalletTransactionSchema.plugin(mongoosePaginate)

const WalletTransaction = connection.model('walletTransaction', WalletTransactionSchema)

module.exports = WalletTransaction