# Notification Service

A robust notification service that supports multiple channels (Email, SMS, and In-App) with queue-based processing and retry mechanisms.

## Features

- Multi-channel notifications (Email, SMS, In-App)
- Queue-based processing using RabbitMQ
- Automatic retry mechanism for failed notifications
- Real-time in-app notifications using Socket.IO
- Comprehensive logging
- Bulk notification support
- Status tracking for sent notifications

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- RabbitMQ
- Twilio Account (for SMS)
- SendLayer Account (for Email)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/notifications

# RabbitMQ
RABBITMQ_URL=amqp://localhost

# Twilio Configuration
TWILIO_SID=your_twilio_account_sid        # Must start with 'AC'
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# SendLayer Configuration
SENDLAYER_API_KEY=your_sendlayer_api_key

# CORS (Optional)
CORS_ORIGIN=*
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd notifications
```

2. Install dependencies:
```bash
npm install
```

3. Start MongoDB and RabbitMQ:
```bash
# Start MongoDB (if not running as a service)
mongod

# Start RabbitMQ (if not running as a service)
# On Windows:
rabbitmq-server
# On Linux/Mac:
sudo service rabbitmq-server start
```

4. Start the server:
```bash
node server.js
```

## API Endpoints

### Send Notification
```http
POST /notifications
Content-Type: application/json

{
    "userId": "user123",
    "type": "email|sms|in-app",
    "to": "recipient@example.com|+1234567890",
    "title": "Notification Title",
    "message": "Notification Message",
    "payload": {} // Optional additional data
}
```

### Get User Notifications
```http
GET /users/:id/notifications
```

## WebSocket Events

### Client Connection
```javascript
const socket = io('http://localhost:3000');

// Authenticate user
socket.emit('authenticate', 'user123');

// Listen for notifications
socket.on('notification', (notification) => {
    console.log('Received notification:', notification);
});
```

## Queue Configuration

The service uses RabbitMQ with the following queues:
- `notifications`: Main queue for processing notifications
- `notifications_retry`: Queue for failed notifications with retry mechanism

Retry configuration:
- Maximum attempts: 3
- Delay between retries: 5 seconds

## Logging

Logs are stored in:
- `error.log`: Error-level logs
- `combined.log`: All logs

## Assumptions

1. MongoDB is running locally on the default port (27017)
2. RabbitMQ is running locally on the default port (5672)
3. Twilio Account SID starts with 'AC'
4. All phone numbers are in E.164 format (e.g., +1234567890)
5. Email addresses are valid and properly formatted
6. User IDs are unique strings

