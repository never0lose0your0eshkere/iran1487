const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  logo: String,
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'RUB'
  },
  category: {
    type: String,
    enum: ['streaming', 'software', 'cloud', 'delivery', 'fitness', 'music', 'other'],
    default: 'other'
  },
  billingPeriod: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  nextBillingDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'expired'],
    default: 'active'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'apple_pay', 'google_pay', 'other'],
    default: 'card'
  },
  notes: String,
  autoImported: {
    type: Boolean,
    default: false
  },
  source: {
    type: String,
    enum: ['manual', 'email', 'payment_api'],
    default: 'manual'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

subscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

subscriptionSchema.virtual('monthlyCost').get(function() {
  switch(this.billingPeriod) {
    case 'weekly':
      return this.cost * 4.33;
    case 'monthly':
      return this.cost;
    case 'quarterly':
      return this.cost / 3;
    case 'yearly':
      return this.cost / 12;
    default:
      return this.cost;
  }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);