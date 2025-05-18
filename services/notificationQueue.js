import amqp from 'amqplib';
import winston from 'winston';
import QUEUE_CONFIG from '../config/queue.js';

// Configure logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

class NotificationQueue {
    constructor() {
        this.connection = null;
        this.channel = null;
    }

    async connect() {
        try {
            this.connection = await amqp.connect(QUEUE_CONFIG.url);
            this.channel = await this.connection.createChannel();
            
            // Assert queues
            await this.channel.assertQueue(QUEUE_CONFIG.queues.notifications, {
                durable: true
            });
            await this.channel.assertQueue(QUEUE_CONFIG.queues.retry, {
                durable: true,
                arguments: {
                    'x-message-ttl': QUEUE_CONFIG.retry.delay,
                    'x-dead-letter-exchange': '',
                    'x-dead-letter-routing-key': QUEUE_CONFIG.queues.notifications
                }
            });

            logger.info('Successfully connected to RabbitMQ');
        } catch (error) {
            logger.error('Error connecting to RabbitMQ:', error);
            throw error;
        }
    }

    async publishNotification(notification) {
        try {
            if (!this.channel) {
                await this.connect();
            }

            const message = {
                ...notification,
                attempts: 0
            };

            await this.channel.sendToQueue(
                QUEUE_CONFIG.queues.notifications,
                Buffer.from(JSON.stringify(message)),
                { persistent: true }
            );

            logger.info('Notification published to queue:', notification);
        } catch (error) {
            logger.error('Error publishing notification:', error);
            throw error;
        }
    }

    async processNotification(handler) {
        try {
            if (!this.channel) {
                await this.connect();
            }

            await this.channel.consume(QUEUE_CONFIG.queues.notifications, async (msg) => {
                if (msg !== null) {
                    const notification = JSON.parse(msg.content.toString());
                    
                    try {
                        await handler(notification);
                        this.channel.ack(msg);
                        logger.info('Notification processed successfully:', notification);
                    } catch (error) {
                        logger.error('Error processing notification:', error);
                        
                        // Handle retry logic
                        if (notification.attempts < QUEUE_CONFIG.retry.maxAttempts) {
                            notification.attempts += 1;
                            await this.channel.sendToQueue(
                                QUEUE_CONFIG.queues.retry,
                                Buffer.from(JSON.stringify(notification)),
                                { persistent: true }
                            );
                            logger.info(`Notification queued for retry (attempt ${notification.attempts}):`, notification);
                        } else {
                            logger.error('Max retry attempts reached for notification:', notification);
                            // Here you could implement dead letter queue or error handling
                        }
                        
                        this.channel.ack(msg);
                    }
                }
            });

            logger.info('Started consuming notifications');
        } catch (error) {
            logger.error('Error setting up notification consumer:', error);
            throw error;
        }
    }

    async close() {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
            logger.info('Queue connection closed');
        } catch (error) {
            logger.error('Error closing queue connection:', error);
            throw error;
        }
    }
}

export default new NotificationQueue(); 