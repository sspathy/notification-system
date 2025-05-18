import axios from 'axios';
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

const SENDLAYER_API_KEY = process.env.SENDLAYER_API_KEY;
const SENDLAYER_API_URL = 'https://api.sendlayer.com/v1';

export const sendEmail = async ({ to, subject, html, from = 'noreply@yourdomain.com' }) => {
    try {
        if (!SENDLAYER_API_KEY) {
            throw new Error('SendLayer API key is not configured');
        }

        const response = await axios.post(
            `${SENDLAYER_API_URL}/emails`,
            {
                to,
                from,
                subject,
                html
            },
            {
                headers: {
                    'Authorization': `Bearer ${SENDLAYER_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        logger.info('Email sent successfully:', {
            to,
            subject,
            messageId: response.data.id
        });

        return response.data;
    } catch (error) {
        logger.error('Error sending email:', {
            to,
            subject,
            error: error.message
        });
        throw error;
    }
};

export const sendBulkEmails = async (emails) => {
    try {
        if (!SENDLAYER_API_KEY) {
            throw new Error('SendLayer API key is not configured');
        }

        const response = await axios.post(
            `${SENDLAYER_API_URL}/emails/bulk`,
            {
                emails
            },
            {
                headers: {
                    'Authorization': `Bearer ${SENDLAYER_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        logger.info('Bulk emails sent successfully:', {
            count: emails.length,
            batchId: response.data.batchId
        });

        return response.data;
    } catch (error) {
        logger.error('Error sending bulk emails:', {
            count: emails.length,
            error: error.message
        });
        throw error;
    }
};
