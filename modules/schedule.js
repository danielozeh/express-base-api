const config = require('../config')
const open = require('amqplib').connect(config.amqp.url);
const channelPromise = open.then((conn) => conn.createChannel());

const ErrorScope = 'modules:schedule';
const DEBUG = require('debug')(ErrorScope)

// Publisher
const publishMessageToQueue = (queueName, message={}) => {
	return new Promise((resolve, reject) => {
		channelPromise.then((channel) => {
			channel.assertQueue(queueName)
			channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)));
			resolve('Queued');
		})
		.catch((err) => {
			reject(err)
		});
	})
}

// Delayed Publisher
const publishDelayedMessageToQueue = (queueName, message={}, delay) => {
	return new Promise((resolve, reject) => {
		channelPromise.then((channel) => {
			// get the current date & time (as milliseconds since Epoch)
			let currentTimeAsMs = Date.now();

			// Add 3 days to the current date & time
			//   I'd suggest using the calculated static value instead of doing inline math
			//   I did it this way to simply show where the number came from
			let adjustedTimeAsMs = currentTimeAsMs + (delay);

			// create a new Date object, using the adjusted time
			let time_in_future = new Date(adjustedTimeAsMs);

			message['queue_time'] = time_in_future;

			channel.assertQueue(queueName)
			channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)));
			resolve('Queued');
		})
		.catch((err) => {
			reject(err)
		});
	})
}


module.exports = {
	Schedule: {
		publishMessageToQueue,
		publishDelayedMessageToQueue	
	}
}