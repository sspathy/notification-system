import { Server } from 'socket.io';
import winston from 'winston';

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

class InAppService {
    constructor() {
        this.io = null;
        this.userSockets = new Map(); // Map to store user ID to socket connections
    }

    init(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.CORS_ORIGIN || '*',
                methods: ['GET', 'POST']
            }
        });

        this.io.on('connection', (socket) => {
            logger.info('New socket connection:', socket.id);

            // Handle user authentication
            socket.on('authenticate', (userId) => {
                if (userId) {
                    this.userSockets.set(userId, socket.id);
                    logger.info(`User ${userId} authenticated with socket ${socket.id}`);
                }
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                // Remove user from the map
                for (const [userId, socketId] of this.userSockets.entries()) {
                    if (socketId === socket.id) {
                        this.userSockets.delete(userId);
                        logger.info(`User ${userId} disconnected`);
                        break;
                    }
                }
            });
        });

        logger.info('In-app notification service initialized');
    }

    broadcastInApp(userId, notification) {
        try {
            const socketId = this.userSockets.get(userId);
            if (socketId) {
                this.io.to(socketId).emit('notification', notification);
                logger.info(`Notification sent to user ${userId}:`, notification);
            } else {
                logger.warn(`No active socket found for user ${userId}`);
            }
        } catch (error) {
            logger.error(`Error sending in-app notification to user ${userId}:`, error);
            throw error;
        }
    }

    broadcastToAll(notification) {
        try {
            this.io.emit('notification', notification);
            logger.info('Broadcast notification sent to all users:', notification);
        } catch (error) {
            logger.error('Error broadcasting notification:', error);
            throw error;
        }
    }
}

export default new InAppService(); 