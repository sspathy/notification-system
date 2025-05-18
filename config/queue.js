import amqp from 'amqplib';

const QUEUE_CONFIG = {
    url: process.env.RABBITMQ_URL || 'amqp://localhost',
    queues: {
        notifications: 'notifications',
        retry: 'notifications_retry'
    },
    retry: {
        maxAttempts: 3,
        delay: 5000 // 5 seconds
    }
};

export default QUEUE_CONFIG; 
