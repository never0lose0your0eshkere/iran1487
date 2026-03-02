const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  type: {
    type: String,
    enum: ['upcoming_bill', 'price_change', 'inactivity', 'payment_success', 'payment_failed'],
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
  data: mongoose.Schema.Types.Mixed,
  read: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  scheduledFor: Date,
  deliveredAt: Date
});

module.exports = mongoose.model('Notification', notificationSchema);