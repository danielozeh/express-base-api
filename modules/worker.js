const config = require('../config')
const open = require('amqplib').connect(config.amqp.url);
const channelPromise = open.then((conn) => conn.createChannel());

const {sendVerificationCode} = require('../core/tasks/notification');

//List of consumers with handlers
const schedules = [
	{type: "send-account-created-verification-code", handler: sendVerificationCode},
	{type: 'send-forgot-password-code', handler: sendVerificationCode},
	{type: 'send-forgot-pin-code', handler: sendVerificationCode}
];

// Consumer
const consumeMessageFromQueue = (queueName, execution) => {
	return new Promise((resolve, reject) => {
		// Consumer
		channelPromise.then((channel) => {
			channel.assertQueue(queueName);
			channel.consume(queueName, (msg) => {
				if (msg !== null) {
					execution(channel, msg);
				}
			});
		})
		.catch((err) => {
			reject(err)
		});		
	})
}

/*Initialize consumers for applications.*/
const initializeConsumers = () => {
	try{
		schedules.forEach(schedule_obj => {
			let {type, handler} = schedule_obj;
			//console.log('Consumer for=========================')
			//console.log(schedule_obj);
			consumeMessageFromQueue(type, (channel, msg) => {
				let data = JSON.parse(msg.content.toString());
				//console.log('Data=========================')
				//console.log(data);
				let parsed_data = (typeof data === "object") ? data : JSON.parse(data);
				//console.log('Parsed Data=========================')
				//console.log(parsed_data);
				//console.log('handler=========================')
				//console.log(handler);
				//handle function for consumer
				handler(parsed_data)
				.then(complete => {
					console.log('Task complete======================')
					console.log(complete);
					channel.ack(msg);
				})
				.catch(e => {
					console.log('Error %O', e)
				})
			})
		})
	}catch(e){
		console.log('Error %O', e)
	}
}

initializeConsumers();