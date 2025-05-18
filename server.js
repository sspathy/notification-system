import 'dotenv/config';
import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';

import Notification from './models/Notification.js';
import { sendEmail } from './services/emailService.js';
import { sendSms } from './services/smsService.js';
import inAppService from './services/inAppService.js';
import notificationQueue from './services/notificationQueue.js';
import notificationProcessor from './services/notificationProcessor.js';

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.post('/notifications', async (req, res) => {
  const { userId, type, to, title, message, payload } = req.body;
  try {
    const notif = await Notification.create({
      userId, type, to, title, message, payload, createdAt: new Date()
    });
    if (type === 'email') {
      await sendEmail({ to, subject: title, html: `<p>${message}</p>` });
    } else if (type === 'sms') {
      await sendSms({ userId, to, body: message });
    } else if (type === 'in-app') {
      inAppService.broadcastInApp(userId, { title, message, ...payload });
    }
    res.status(201).json({ success: true, notification: notif });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/users/:id/notifications', async (req, res) => {
  const notifications = await Notification
    .find({ userId: req.params.id })
    .sort({ createdAt: -1 });
  res.json({ notifications });
});

const server = http.createServer(app);
inAppService.init(server);

// Register handlers for different notification types
notificationProcessor.registerHandler('email', async (data) => {
    // Handle email notification
    // Use your SendLayer API here
});

notificationProcessor.registerHandler('sms', async (data) => {
    // Handle SMS notification
    // Use your Twilio API here
});

// Start the notification processor
await notificationProcessor.start();

// To send a notification
await notificationQueue.publishNotification({
    type: 'email',
    data: {
        to: 'user@example.com',
        subject: 'Test Email',
        body: 'Hello World'
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Notification service listening on port ${PORT}`);
});
