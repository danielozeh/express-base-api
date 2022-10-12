const { connection, mongoose } = require('../core/db')
const { Schema, Types : { ObjectId, Map }} = mongoose;
const mongoosePaginate = require('mongoose-paginate-v2');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const Verification = require('./verification')
const {Schedule} = require('../modules/schedule')
const {Strings} = require('../utils/strings')
const config = require('../config')

var UserSchema = new Schema({
    avatar: {
        type: String,
        required: false
    },
    bio: {
        type: String,
        required: false
    },
    date_of_birth: {
        type: Date,
        default: null
    },
    email: {
        type: String,
        required: [true, 'Email is required']
    },
    email_verified_at: {
        type: Date,
        default: null
    },
    first_name: {
        type: String,
        required: [true, 'Full name is required']
    },
    last_name: {
        type: String,
        required: [true, 'Last name is required']
    },
    is_active: {
        type: Boolean,
        required: [true, 'Make sure to set user active status'],
        default: true
    },
    is_verified: {
        type: Boolean,
        required: [true, 'Make sure to set user verified status'],
        default: false
    },
    password: {
        type: String,
        required: [true, 'Password cannot be empty']
    },
    phone_number: {
        type: String,
        required: false
    },
    pin: {
        type: String,
        required: false
    },
    public_key: {
        type: String
    },
    secret_key: {
        type: String
    },
    wallet_balance: {
        type: Number,
        default: 0.00
    }
}, {
    timestamps: { createdAt: 'created_at',  updatedAt: 'updated_at', deletedAt: 'deleted_at' },
})

UserSchema.statics = {
    createNewAccount: async(payload) => {
        try {
            register_valid = await User.validateRegistrationPayload(payload)
            if(!register_valid.status) {
                return register_valid
            }
            const hashedPassword = await User.getHashPassword(payload.password)
            //create user
            const create_user = await User.create({email: payload.email, full_name: payload.first_name, last_name: payload.last_name, password: hashedPassword})
            if(create_user) {
                await User.createVerificationCode(payload.email, type = 'account_created')
                return { status: true, message: 'Account created successfully', data: {
                    _id: create_user._id,
                    email: create_user.email,
                    first_name: create_user.first_name,
                    last_name: create_user.last_name,
                    is_active: create_user.is_active,
                    is_verified: create_user.is_verified,
                    created_at: create_user.created_at,
                    updated_at: create_user.updated_at
                } }
            }
            return { status: false, message: 'Failed to create an account' }
        }
        catch(e) {
            return { status: false, message: 'An error occurred creating account' }
        }
    },

    validateRegistrationPayload: async(payload) => {
        const find_email = await User.findByEmail(payload.email)
        if(find_email.status) {
            return { status: false, message: 'Email already taken' }
        }

        return { status: true, message: 'Validation complete' }
    },

    getHashPassword(password) {
        const salt = bcrypt.genSaltSync()
        return bcrypt.hashSync(password, salt)
    },

    findByEmail: async(email) => {
        const is_found = await User.findOne({email}).lean()
        if(is_found) {
            return { status: true, message: 'Email found', data: is_found }
        }
        else {
            return { status: false, message: 'Email not found' }
        }
    },

    createVerificationCode: async(user, type, queue_name = 'send-account-created-verification-code') => {
        try {
            //generate new code
            let code = '12345'
            let account_type = 'email'
            let expiry_in = '10'
            //check if user already exist
            const is_found = await Verification.findOne({user, type})
            if(is_found) {
                //update previous verification code
                await Verification.findOneAndUpdate({user, type}, {code, expiry_in, account_type})
            }
            else {
                //create new verification code
                await Verification.create({ user, type, code, expiry_in, account_type })
            }
            //publish message to queue
            const queue_data = {user, type, code, expiry_in, account_type}
            Schedule.publishMessageToQueue(queue_name, queue_data)
            .then(messagePublished => {
                console.log('Message %O', messagePublished)
            })
            .catch(e => {
                console.log('An error occured %O', e)                 
            });
            return { status: true, message: 'Verification code sent' }
        }
        catch(e) {
            console.log(e.message)
            return { status: false, message: 'An error occured sending verification code' }
        }
    },

    resendVerificationCode: async(email, type = 'account_created') => {
        //check if user is alrady verified
        const find_email = await User.findByEmail(email)
        if(!find_email.status) {
            return { status: false, message: 'Account does not exist' }
        }
        const user_data = find_email.data
        if(user_data.is_verified) {
            return { status: false, message: 'Account already verified' }
        }
        if(!user_data.is_active) {
            return { status: false, message: 'Account is inactive' }
        }
        const send_code = await User.createVerificationCode(email, type)
        return send_code
    },

    verifyAccount: async(email, code) => {
        const find_email = await User.findByEmail(email)
        if(!find_email.status) {
            return { status: false, message: 'Account does not exist' }
        }
        const user_data = find_email.data
        if(user_data.is_verified) {
            return { status: false, message: 'Account already verified' }
        }
        const check_code = await Verification.findOne({user: email, code, type: 'account_created'})   
        if(!check_code) {
            return { status: false, message: 'Invalid verification code' }
        }
        //generate secret & public keys
        let keys = User.generateKeyPair(32);
        let { public_key_ref, secret_key_ref } = keys
        let public_key = `pk_live_${public_key_ref}`
        let secret_key = `sk_live_${secret_key_ref}`

        //update user and set keys
        const user = await User.findByIdAndUpdate(user_data._id, { is_verified: true, email_verified_at: new Date(), public_key, secret_key }, { new: true }).lean()
        delete user.password
        delete user.pin
        await Verification.findOneAndDelete({user, type})

        const token = await User.generateToken({id: user_data._id})
        return { status: true, message: 'Account verified successfully', data: {user, access_token: token, refresh_token: token} }
    },

    generateKeyPair(length) {
        let public_key_ref = `${Strings.generateRandomKey(length)}`;
        let secret_key_ref = `${Strings.generateRandomKey(length)}`;
    
        return{
            public_key_ref,
            secret_key_ref,
        };
    },

    generateToken(user) {
        const token = jwt.sign(user, config.secret)
        return token
    },

    login: async(email, password) => {
        const find_email = await User.findByEmail(email)
        if(!find_email.status) {
            return { status: false, message: 'Account does not exist' }
        }
        const user_data = find_email.data
        if(!user_data.is_verified) {
            return { status: false, message: 'Account is not verified' }
        }
        if(!user_data.is_active) {
            return { status: false, message: 'Account is not active' }
        }
        const is_password = bcrypt.compareSync(password, user_data.password)
        if(!is_password) {
            return { status: false, message: 'Invalid credentials' }
        }
        user_data.is_pin_created = false
        if(user_data.pin && user_data.pin != '') {
            user_data.is_pin_created = true
        }
        delete user_data.password
        delete user_data.pin
        const token = await User.generateToken({id: user_data._id})
        return { status: true, message: 'Login successful', data: {user: user_data, access_token: token, refresh_token: token} }
    },

    forgotPassword: async(email) => {
        const find_email = await User.findByEmail(email)
        if(!find_email.status) {
            return { status: false, message: 'Account does not exist' }
        }
        await User.createVerificationCode(email, type = 'forgot_password', queue_name = 'send-forgot-password-code')
        return { status: true, message: 'Forgot password token sent to your email' }
    },

    resetPassword: async(email, token, password) => {
        const find_email = await User.findByEmail(email)
        if(!find_email.status) {
            return { status: false, message: 'Account does not exist' }
        }
        //check if token is valid
        const validate_token = await Verification.findOne({ user: email, type: 'forgot_password', code: token })
        if(!validate_token) {
            return { status: false, message: 'Invalid token' }
        }
        await Verification.findOneAndDelete({user: email, type: 'forgot_password'})
        const hashedPassword = await User.getHashPassword(password)
        //update user
        const user = await User.findOneAndUpdate({ email }, {password: hashedPassword})
        User.deleteUnnecessaryKeys({password: user.password, pin: user.pin})
        return { status: true, message: 'Password  reset successful', data: user }
    },

    userProfile: async(user_id) => {
        const user = await User.findById(user_id).lean()
        if(!user) {
            return { status: false, message: 'User does not exist' }
        }
        user.is_pin_created = false
        if(user.pin && user.pin != '') {
            user.is_pin_created = true
        }
        User.deleteUnnecessaryKeys({password: user.password, pin: user.pin})
        return { status: true, message: 'User profile', data: user }
    },

    userUnleanedProfile: async(user_id) => {
        const user = await User.findById(user_id)
        if(!user) {
            return { status: false, message: 'User does not exist' }
        }
        user.is_pin_created = false
        if(user.pin && user.pin != '') {
            user.is_pin_created = true
        }
        return { status: true, message: 'User profile', data: user }
    },

    verifyUserPin: async(pin, user_pin) => {
        const is_pin = bcrypt.compareSync(pin, user_pin)
        if (!is_pin) {
            return false
        }
        return true
    },

    verifyUserPassword: async(password, user_password) => {
        const is_password = bcrypt.compareSync(password, user_password)
        if (!is_password) {
            return false
        }
        return true
    },

    deleteUnnecessaryKeys(payload) {
        delete payload.password
        delete payload.pin
    },

    editProfile: async(payload) => {
        const { user_id, first_name, last_name, bio, phone_number } = payload
        const edit = await User.findByIdAndUpdate(user_id, { first_name, last_name, bio, phone_number }, {new: true}).lean()
        if(edit) {
            delete edit.password
            delete edit.pin
            return { status: true, message: 'Profile updated successfully', data: edit }
        }
        return { status: false, message: 'Failed to update profile information' }
    },

    updateAvatar: async(user_id, avatar) => {
        const update = await User.findByIdAndUpdate(user_id, {avatar}, {new: true}).lean()
        if(update) {
            delete update.password
            delete update.pin
            return { status: true, message: 'Profile picture updated', data: update }
        }
        return { status: false, message: 'Failed to update profile picture' }
    },

    getUserBalance: async(user_id) => {
        const balance = await User.findById(user_id).select('wallet_balance')
        if(balance) {
            return { status: true, message: 'Balance retrievd successfully', data: balance }
        }
        return { status: false, message: 'Failed to retrieve wallet balance' }
    },

    createPin: async(user_id, pin) => {
        const user_profile = await User.userUnleanedProfile(user_id)
        if(user_profile.data.pin || user_profile.data.pin == '') {
            return {status: false, message: 'PIN already created' }
        }
        const pinHash = await User.getHashPassword(pin)
        //update pin
        const create = await User.updateUserPin(user_id, pinHash);
        if(create.status) {
            return { status: true, message: 'PIN created successfully' }
        }
        return { status: false, message: 'Failed to create PIN.' }
    },

    updateUserPin: async(user_id, pin) => {
        const update_pin = await User.findByIdAndUpdate(user_id, { pin: pin })
        if(update_pin) {
            return { status: true, message: 'PIN updated successfully' }
        }
        return { status: false, message: 'Failed to update PIN' }
    },
    
    changePassword: async(user_id, old_password, new_password) => {
        //get user profile
        const user = await User.userUnleanedProfile(user_id)
        if(!user.status) {
            return { status: false, message: 'Account does not exist' }
        }
        //check if pssword is valid
        const is_password = await User.verifyUserPassword(old_password, user.data.password)
        if(!is_password) {
            return { status: false, message: 'Old password is invalid' }
        }
        
        const change_password = await User.findByIdAndUpdate(user_id, {password: User.getHashPassword(new_password)}).exec()
        if(change_password) {
            return { status: true, message: 'Password changed successfully', data: change_password }
        }
        return { sttaus: false, message: 'Failed to change password' }
    },

    changePin: async(user_id, old_pin, new_pin) => {
        //get user profile
        const user = await User.userUnleanedProfile(user_id)
        if(!user.status) {
            return { status: false, message: 'Account does not exist' }
        }
        //check if pin is valid
        const is_password = await User.verifyUserPin(old_pin, user.data.pin)
        if(!is_password) {
            return { status: false, message: 'Old pin is invalid' }
        }
        
        const change_pin = await User.findByIdAndUpdate(user_id, {pin: User.getHashPassword(new_pin)}).exec()
        if(change_pin) {
            return { status: true, message: 'Pin changed successfully', data: change_pin }
        }
        return { sttaus: false, message: 'Failed to change pin' }
    },

    forgotPin: async(email) => {
        const find_email = await User.findByEmail(email)
        if(!find_email.status) {
            return { status: false, message: 'Account does not exist' }
        }
        await User.createVerificationCode(email, type = 'forgot_pin', queue_name = 'send-forgot-pin-code')
        return { status: true, message: 'Forgot pin token sent to your email' }
    },

    resetPassword: async(email, token, pin) => {
        const find_email = await User.findByEmail(email)
        if(!find_email.status) {
            return { status: false, message: 'Account does not exist' }
        }
        //check if token is valid
        const validate_token = await Verification.findOne({ user: email, type: 'forgot_pin', code: token })
        if(!validate_token) {
            return { status: false, message: 'Invalid token' }
        }
        await Verification.findOneAndDelete({user: email, type: 'forgot_pin'})
        const hashedPin = await User.getHashPassword(pin)
        //update user
        const user = await User.findOneAndUpdate({ email }, {pin: hashedPin})
        User.deleteUnnecessaryKeys({password: user.password, pin: user.pin})
        return { status: true, message: 'Pin  reset successful', data: user }
    },
}

UserSchema.plugin(mongoosePaginate)

const User = connection.model('User', UserSchema);

module.exports = User