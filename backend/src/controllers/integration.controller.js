const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Imap = require('imap');
const { simpleParser } = require('mailparser');

exports.connectEmail = async (req, res) => {
  try {
    const { email, password, provider } = req.body;

    // Test connection
    const imap = new Imap({
      user: email,
      password: password,
      host: getImapHost(provider),
      port: 993,
      tls: true
    });

    await new Promise((resolve, reject) => {
      imap.once('ready', resolve);
      imap.once('error', reject);
      imap.connect();
    });

    // Save integration settings
    await User.findByIdAndUpdate(req.user._id, {
      'integrations.email': {
        provider,
        email,
        connected: true,
        lastSync: new Date()
      }
    });

    // Start background sync
    syncEmails(req.user._id, email, password, provider);

    res.json({ 
      success: true, 
      message: 'Email connected successfully' 
    });
  } catch (error) {
    console.error('Email connection error:', error);
    res.status(400).json({ 
      error: 'Failed to connect email. Please check your credentials.' 
    });
  }
};

exports.disconnectEmail = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      'integrations.email': {
        connected: false,
        provider: null,
        email: null
      }
    });

    res.json({ 
      success: true, 
      message: 'Email disconnected successfully' 
    });
  } catch (error) {
    console.error('Email disconnection error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getEmailStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      connected: user.integrations.email.connected,
      provider: user.integrations.email.provider,
      email: user.integrations.email.email,
      lastSync: user.integrations.email.lastSync
    });
  } catch (error) {
    console.error('Get email status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Background sync function
async function syncEmails(userId, email, password, provider) {
  const imap = new Imap({
    user: email,
    password: password,
    host: getImapHost(provider),
    port: 993,
    tls: true
  });

  imap.once('ready', () => {
    imap.openBox('INBOX', false, (err, box) => {
      if (err) {
        console.error('Open mailbox error:', err);
        return;
      }

      // Search for subscription-related emails
      const searchCriteria = [
        'OR',
        ['SUBJECT', 'subscription'],
        ['SUBJECT', 'подписк'],
        ['BODY', 'receipt'],
        ['BODY', 'чек'],
        ['BODY', 'payment'],
        ['BODY', 'платеж']
      ];

      imap.search(searchCriteria, (err, results) => {
        if (err || !results.length) {
          imap.end();
          return;
        }

        const fetch = imap.fetch(results.slice(-20), { // Last 20 emails
          bodies: '',
          struct: true
        });

        fetch.on('message', (msg) => {
          msg.on('body', (stream) => {
            simpleParser(stream, async (err, parsed) => {
              if (err) return;

              // Extract subscription info from email
              const subscription = extractSubscriptionFromEmail(parsed);
              
              if (subscription) {
                // Check if subscription already exists
                const exists = await Subscription.findOne({
                  userId,
                  name: subscription.name,
                  autoImported: true
                });

                if (!exists) {
                  // Create new subscription from email
                  await Subscription.create({
                    userId,
                    ...subscription,
                    autoImported: true,
                    source: 'email'
                  });
                }
              }
            });
          });
        });

        fetch.once('end', () => {
          imap.end();
        });
      });
    });
  });

  imap.connect();
}

// Helper functions
function getImapHost(provider) {
  const hosts = {
    'gmail': 'imap.gmail.com',
    'yandex': 'imap.yandex.ru',
    'mailru': 'imap.mail.ru',
    'outlook': 'imap-mail.outlook.com'
  };
  return hosts[provider] || 'imap.gmail.com';
}

function extractSubscriptionFromEmail(parsed) {
  const text = parsed.text || '';
  const subject = parsed.subject || '';
  
  // This is a simplified example - in production you'd use more sophisticated parsing
  const patterns = {
    name: /(?:subscription to|подписка на)\s+([A-Za-z0-9\s]+)/i,
    amount: /(?:amount|sum|cost|price|сумма|цена|стоимость)[:\s]*([0-9,.]+)\s*(?:руб|₽|rub)/i,
    date: /(?:date|дата)[:\s]*(\d{1,2}[./]\d{1,2}[./]\d{2,4})/i
  };

  const nameMatch = text.match(patterns.name) || subject.match(/([A-Za-z0-9]+)\s+subscription/i);
  const amountMatch = text.match(patterns.amount);
  const dateMatch = text.match(patterns.date);

  if (nameMatch && amountMatch) {
    return {
      name: nameMatch[1].trim(),
      cost: parseFloat(amountMatch[1].replace(',', '.')),
      currency: 'RUB',
      billingPeriod: 'monthly', // Default, should be detected
      startDate: dateMatch ? parseDate(dateMatch[1]) : new Date(),
      nextBillingDate: dateMatch ? parseDate(dateMatch[1]) : new Date(),
      category: detectCategory(text, subject),
      autoImported: true,
      source: 'email'
    };
  }

  return null;
}

function parseDate(dateStr) {
  // Simple date parsing - implement proper date parsing
  const parts = dateStr.split(/[./]/);
  if (parts.length === 3) {
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }
  return new Date();
}

function detectCategory(text, subject) {
  const keywords = {
    streaming: ['netflix', 'spotify', 'apple music', 'youtube', 'кинопоиск'],
    software: ['adobe', 'microsoft', 'office', 'photoshop'],
    cloud: ['google drive', 'icloud', 'dropbox', 'onedrive'],
    delivery: ['delivery', 'доставка', 'food', 'еда'],
    fitness: ['gym', 'fitness', 'тренажерный', 'спорт']
  };

  const combined = (text + ' ' + subject).toLowerCase();

  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(word => combined.includes(word))) {
      return category;
    }
  }

  return 'other';
}