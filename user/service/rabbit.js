const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBIT_URL;

let connection, channel;

/**
 * Establishes a connection to the RabbitMQ server and creates a communication channel.
 * Uses the URL specified in the environment variable RABBIT_URL.
 * Logs a message to the console upon successful connection.
 *
 * @returns {Promise<void>}
 */
async function connect() {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    console.log('Connected to RabbitMQ');
}

/**
 * Subscribes to a RabbitMQ queue and consumes messages from it.
 * If the channel to RabbitMQ is not established, it will be established.
 * The callback function is invoked with the message content as a string.
 * The message is acked after being processed.
 *
 * @param {String} queueName - The name of the RabbitMQ queue to subscribe to.
 * @param {Function} callback - The function to be called with the message content as a string.
 * @returns {Promise<void>}
 */
async function subscribeToQueue(queueName, callback) {
    if (!channel) await connect();
    await channel.assertQueue(queueName);
    channel.consume(queueName, (message) => {
        callback(message.content.toString());
        channel.ack(message);
    });
}

/**
 * Publishes a message to a RabbitMQ queue.
 * If the channel to RabbitMQ is not established, it will be established.
 * The message is sent to the queue as a buffer.
 *
 * @param {String} queueName - The name of the RabbitMQ queue to publish to.
 * @param {String} data - The message content to be sent to the queue.
 * @returns {Promise<void>}
 */
/**
 * Publishes a message to a specified RabbitMQ queue.
 * If the channel to RabbitMQ is not established, it will be established.
 * The message is sent to the queue as a buffer.
 *
 * @param {String} queueName - The name of the RabbitMQ queue to publish to.
 * @param {String} data - The message content to be sent to the queue.
 * @returns {Promise<void>}
 */
async function publishToQueue(queueName, data) {
    if (!channel) await connect();
    await channel.assertQueue(queueName);
    channel.sendToQueue(queueName, Buffer.from(data));
}

module.exports = {
    subscribeToQueue,
    publishToQueue,
    connect,
};
