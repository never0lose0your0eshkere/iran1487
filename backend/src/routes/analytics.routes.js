const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/spending', analyticsController.getSpendingAnalytics);
router.get('/categories', analyticsController.getCategoryBreakdown);

module.exports = router;