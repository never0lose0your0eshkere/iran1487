const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', subscriptionController.createSubscription);
router.get('/', subscriptionController.getSubscriptions);
router.get('/:id', subscriptionController.getSubscription);
router.put('/:id', subscriptionController.updateSubscription);
router.delete('/:id', subscriptionController.deleteSubscription);

module.exports = router;