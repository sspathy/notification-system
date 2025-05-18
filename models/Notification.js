import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['email', 'sms', 'in-app']
    },
    to: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    payload: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending'
    },
    attempts: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    sentAt: {
        type: Date
    }
});

// Add indexes for better query performance
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ status: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification; 