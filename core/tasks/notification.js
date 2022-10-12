const mailgun = require('mailgun-js')
const config = require('../../config')

const sendVerificationCode = (message_object) => {
    return new Promise((resolve, reject) => {
        const mg = mailgun({ apiKey: config.mailgun.apiKey, domain: config.mailgun.domain })
        try {
            let {type} = message_object
            switch (type) {
                case 'account_created':
                    console.log('Account created', message_object)
                    const { email, account_type, code } = message_object
                    if(account_type == 'email') {
                        const msgdata = {
                            from: "Danoice Limited noreply@danoice.com",
                            to: data.to,
                            subject: `Welcome to ${config.appName}`,
                            template: 'account_created',
                            'v:subject': `Welcome to ${config.appName}`,
                            'v:email': email,
                            'v:token': code
                        }
                        mg.messages().send(msgdata, function(error, body) {
                            if(!error) {
                                console.log(body)
                                resolve(true)
                            }
                        })
                    }
                    break;

                case 'forgot_password':
                    console.log('Forgot password', message_object)
                    resolve(true)
                    break;

                case 'forgot_pin':
                    console.log('Forgot pin', message_object)
                    resolve(true)
                    break;
            
                default:
                    reject(false)
                    break;
            }
        }
        catch(e) {

        }
    })
}

module.exports = {
    sendVerificationCode
}