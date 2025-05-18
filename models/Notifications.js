const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId:    { type: String, required: true },
  type:      { type: String, enum: ['email','sms','in-app'], required: true },
  to:        { type: String },      // email address or phone number
  title:     { type: String },
  message:   { type: String },
  payload:   { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
