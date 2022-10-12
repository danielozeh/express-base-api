const { connection, mongoose } = require('../core/db')
const { Schema, Types : { ObjectId, Map }} = mongoose;
const mongoosePaginate = require('mongoose-paginate-v2');

const UserBankSchema = new Schema({
    account_name: {
        type: String,
        required: [true, 'Account name is required']
    },
    account_number: {
        type: String,
        required: [true, 'Acount number is required']
    },
    bank_code: {
        type: String,
        required: [true, 'Bank code is required']
    },
    bank_name: {
        type: String,
        required: false,
    },
    user_id: {
        type: ObjectId,
        ref: 'User'
    }
}, {
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at', deleted_at: 'deleted_at'}
})

UserBankSchema.statics = {
    addBank: async(bank_object) => {
        const {account_number, bank_code, user_id} = bank_object
        //check if bank is already added
        const check = await UserBank.findOne({user_id, bank_code, account_number})
        if(check) {
            return { status: false, message: 'Bank already added' }
        }
        const create = await UserBank.create(bank_object)
        if(create) {
            return { status: true, message: 'Bank added successfully', data: create }
        }
        return { status: false, message: 'Failed to add new bank' }
    },

    findBank: async(id) => {
        const find_bank = await UserBank.findById(id).lean()
        if(find_bank) {
            return { status: true, message: 'Bank information', data: find_bank }
        }
        return { status: false, message: 'Bank not found' }
    },

    findBankByBankID: async(bank_id) => {
        const find_bank = await UserBank.findOne({bank_id})
        if(find_bank) {
            return { status: true, message: 'Bank information', data: find_bank }
        }
        return { status: false, message: 'Bank not found' }
    },

    removeBank: async(id, user_id) => {
        //find bank
        const find_bank = await UserBank.findBank(id)
        if(!find_bank.status) {
            return { status: false, message: 'Bank not found' }
        }
        if(String(find_bank.data.user_id) != String(user_id)) {
            return { status: false, message: 'Bank not added by you' }
        }
        const remove_bank = await UserBank.findByIdAndDelete(id)
        if(remove_bank) {
            return { status: true, message: 'Bank removed successfully', data: remove_bank }
        }
        return { status: false, message: 'Failed to remove bank' }
    },

    myBanks: async(user_id) => {
        const all_banks = await UserBank.find({user_id})
        if(all_banks) {
            return { status: true, message: 'Saved banks', data: all_banks }
        }
        return { status: false, message: 'No bank found' }
    },
}

UserBankSchema.plugin(mongoosePaginate)

const UserBank = connection.model('userBank', UserBankSchema)

module.exports = UserBank