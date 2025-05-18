import twilio from 'twilio';
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

const TWILIO_ACCOUNT_SID = process.env.TWILIO_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Validate Twilio credentials
if (!TWILIO_ACCOUNT_SID || !TWILIO_ACCOUNT_SID.startsWith('AC')) {
    logger.error('Invalid Twilio Account SID. It must start with "AC"');
    throw new Error('Invalid Twilio Account SID configuration');
}

if (!TWILIO_AUTH_TOKEN) {
    logger.error('Twilio Auth Token is not configured');
    throw new Error('Twilio Auth Token is not configured');
}

if (!TWILIO_PHONE_NUMBER) {
    logger.error('Twilio Phone Number is not configured');
    throw new Error('Twilio Phone Number is not configured');
}

// Initialize Twilio client
let twilioClient;
try {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    logger.info('Twilio client initialized successfully');
} catch (error) {
    logger.error('Failed to initialize Twilio client:', error);
    throw error;
}

export const sendSms = async ({ to, body, from = TWILIO_PHONE_NUMBER }) => {
    try {
        const message = await twilioClient.messages.create({
            body,
            to,
            from
        });

        logger.info('SMS sent successfully:', {
            to,
            messageId: message.sid,
            status: message.status
        });

        return message;
    } catch (error) {
        logger.error('Error sending SMS:', {
            to,
            error: error.message
        });
        throw error;
    }
};

export const sendBulkSms = async (messages) => {
    try {
        const results = await Promise.all(
            messages.map(({ to, body }) =>
                twilioClient.messages.create({
                    body,
                    to,
                    from: TWILIO_PHONE_NUMBER
                })
            )
        );

        logger.info('Bulk SMS sent successfully:', {
            count: messages.length,
            messageIds: results.map(msg => msg.sid)
        });

        return results;
    } catch (error) {
        logger.error('Error sending bulk SMS:', {
            count: messages.length,
            error: error.message
        });
        throw error;
    }
};

export const getSmsStatus = async (messageId) => {
    try {
        const message = await twilioClient.messages(messageId).fetch();
        return message.status;
    } catch (error) {
        logger.error('Error fetching SMS status:', {
            messageId,
            error: error.message
        });
        throw error;
    }
};
