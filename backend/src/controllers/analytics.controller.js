const Subscription = require('../models/Subscription');

exports.getSpendingAnalytics = async (req, res) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;
    
    const query = { userId: req.user._id, status: 'active' };
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const subscriptions = await Subscription.find(query);

    const totalMonthly = subscriptions.reduce((sum, sub) => sum + sub.monthlyCost, 0);
    
    const byCategory = {};
    subscriptions.forEach(sub => {
      const category = sub.category;
      if (!byCategory[category]) {
        byCategory[category] = {
          count: 0,
          monthlyCost: 0,
          yearlyCost: 0
        };
      }
      byCategory[category].count++;
      byCategory[category].monthlyCost += sub.monthlyCost;
      byCategory[category].yearlyCost += sub.monthlyCost * 12;
    });

    const byPeriod = {};
    subscriptions.forEach(sub => {
      const period = sub.billingPeriod;
      if (!byPeriod[period]) {
        byPeriod[period] = {
          count: 0,
          totalCost: 0
        };
      }
      byPeriod[period].count++;
      byPeriod[period].totalCost += sub.cost;
    });

    const yearlyForecast = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      
      let monthTotal = 0;
      subscriptions.forEach(sub => {
        if (isSubscriptionActiveInMonth(sub, date)) {
          monthTotal += sub.monthlyCost;
        }
      });
      
      yearlyForecast.push({
        month: date.toLocaleString('default', { month: 'long' }),
        year: date.getFullYear(),
        total: monthTotal
      });
    }

    const trends = calculateTrends(subscriptions);

    res.json({
      summary: {
        totalSubscriptions: subscriptions.length,
        totalMonthly: Math.round(totalMonthly * 100) / 100,
        totalYearly: Math.round(totalMonthly * 12 * 100) / 100,
        averagePerSubscription: Math.round((totalMonthly / subscriptions.length) * 100) / 100 || 0
      },
      byCategory,
      byPeriod,
      yearlyForecast,
      trends
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getCategoryBreakdown = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ 
      userId: req.user._id, 
      status: 'active' 
    });

    const categories = {};
    
    subscriptions.forEach(sub => {
      if (!categories[sub.category]) {
        categories[sub.category] = {
          name: sub.category,
          count: 0,
          monthlySpend: 0,
          subscriptions: []
        };
      }
      
      categories[sub.category].count++;
      categories[sub.category].monthlySpend += sub.monthlyCost;
      categories[sub.category].subscriptions.push({
        id: sub._id,
        name: sub.name,
        cost: sub.cost,
        monthlyCost: sub.monthlyCost
      });
    });

    res.json(Object.values(categories));
  } catch (error) {
    console.error('Category breakdown error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

function isSubscriptionActiveInMonth(subscription, date) {
  const startDate = new Date(subscription.startDate);
  const nextBilling = new Date(subscription.nextBillingDate);
  
  return date >= startDate && 
         subscription.status === 'active' &&
         (!subscription.endDate || date <= subscription.endDate);
}

function calculateTrends(subscriptions) {
  const now = new Date();
  const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
  const twoMonthsAgo = new Date(now.setMonth(now.getMonth() - 1));

  const currentMonthTotal = subscriptions
    .filter(s => isSubscriptionActiveInMonth(s, new Date()))
    .reduce((sum, s) => sum + s.monthlyCost, 0);

  const lastMonthTotal = subscriptions
    .filter(s => isSubscriptionActiveInMonth(s, lastMonth))
    .reduce((sum, s) => sum + s.monthlyCost, 0);

  const twoMonthsAgoTotal = subscriptions
    .filter(s => isSubscriptionActiveInMonth(s, twoMonthsAgo))
    .reduce((sum, s) => sum + s.monthlyCost, 0);

  const monthOverMonth = lastMonthTotal ? 
    ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  return {
    currentMonth: currentMonthTotal,
    lastMonth: lastMonthTotal,
    twoMonthsAgo: twoMonthsAgoTotal,
    monthOverMonth: Math.round(monthOverMonth * 100) / 100,
    trend: monthOverMonth > 0 ? 'up' : monthOverMonth < 0 ? 'down' : 'stable'
  };
}