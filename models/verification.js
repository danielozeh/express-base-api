const { connection, mongoose } = require('../core/db')
const { Schema, Types : { ObjectId, Map }} = mongoose;
const mongoosePaginate = require('mongoose-paginate-v2');

const {Schedule} = require('../modules/schedule')

var VerificationSchema = new Schema({
    user: {
        type: String,
        required: [true, 'User is required']
    },
    type: {
        type: String,
        enum: ['account_created', 'forgot_password', 'forgot_pin'],
        required: true
    },
    code: {
        type: String,
        required: true,
    },
    expiry_in: {
        type: String,
        required: false,
        default: '10'
    },
    account_type: {
        type: String,
        required: true,
        default: 'email'
    }
}, {
    timestamps: { createdAt: 'created_at',  updatedAt: 'updated_at', deletedAt: 'deleted_at' },
})

VerificationSchema.statics = {
    
}

VerificationSchema.plugin(mongoosePaginate)

const Verification = connection.model('Verification', VerificationSchema);

module.exports = Verification