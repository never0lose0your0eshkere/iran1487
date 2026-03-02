const Subscription = require('../models/Subscription');
const Notification = require('../models/Notification');

exports.createSubscription = async (req, res) => {
  try {
    const subscriptionData = {
      ...req.body,
      userId: req.user._id
    };

    const subscription = new Subscription(subscriptionData);
    await subscription.save();

    await scheduleNotification(subscription);

    res.status(201).json(subscription);
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getSubscriptions = async (req, res) => {
  try {
    const { status, category, period } = req.query;
    const query = { userId: req.user._id };

    if (status) query.status = status;
    if (category) query.category = category;
    if (period) query.billingPeriod = period;

    const subscriptions = await Subscription.find(query)
      .sort({ nextBillingDate: 1 });

    res.json(subscriptions);
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    await rescheduleNotifications(subscription);

    res.json(subscription);
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    await Notification.deleteMany({ subscriptionId: subscription._id });

    res.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Delete subscription error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

async function scheduleNotification(subscription) {
  const daysBefore = subscription.user?.settings?.daysBefore || 3;
  const notificationDate = new Date(subscription.nextBillingDate);
  notificationDate.setDate(notificationDate.getDate() - daysBefore);

  const notification = new Notification({
    userId: subscription.userId,
    subscriptionId: subscription._id,
    type: 'upcoming_bill',
    title: `Upcoming payment: ${subscription.name}`,
    message: `Your ${subscription.name} subscription of ${subscription.cost} ${subscription.currency} will be charged on ${subscription.nextBillingDate.toLocaleDateString()}`,
    scheduledFor: notificationDate
  });

  await notification.save();
}

async function rescheduleNotifications(subscription) {
  await Notification.deleteMany({ subscriptionId: subscription._id });
  await scheduleNotification(subscription);
}