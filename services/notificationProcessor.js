import winston from 'winston';
import notificationQueue from './notificationQueue.js';

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

class NotificationProcessor {
    constructor() {
        this.handlers = new Map();
    }

    registerHandler(type, handler) {
        this.handlers.set(type, handler);
    }

    async processNotification(notification) {
        const { type, data } = notification;
        const handler = this.handlers.get(type);

        if (!handler) {
            throw new Error(`No handler registered for notification type: ${type}`);
        }

        try {
            await handler(data);
            logger.info(`Successfully processed ${type} notification:`, data);
        } catch (error) {
            logger.error(`Error processing ${type} notification:`, error);
            throw error;
        }
    }

    async start() {
        try {
            await notificationQueue.connect();
            await notificationQueue.processNotification(this.processNotification.bind(this));
            logger.info('Notification processor started');
        } catch (error) {
            logger.error('Error starting notification processor:', error);
            throw error;
        }
    }

    async stop() {
        try {
            await notificationQueue.close();
            logger.info('Notification processor stopped');
        } catch (error) {
            logger.error('Error stopping notification processor:', error);
            throw error;
        }
    }
}

export default new NotificationProcessor(); 