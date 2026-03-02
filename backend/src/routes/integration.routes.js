const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integration.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/email/connect', integrationController.connectEmail);
router.post('/email/disconnect', integrationController.disconnectEmail);
router.get('/email/status', integrationController.getEmailStatus);

module.exports = router;