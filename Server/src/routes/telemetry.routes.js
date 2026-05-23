const express = require('express');
const router = express.Router();
const telemetryController = require('../controllers/telemetry.controller');
const { protect } = require('../middleware/auth');

// Middleware to authenticate agent sync using API Key
const requireApiKey = (req, res, next) => {
  const apiKey = req.headers['x-telemetry-key'];
  const expectedKey = process.env.TELEMETRY_API_KEY || 'default_itam_agent_key';
  
  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({ message: 'Invalid or missing API key' });
  }
  next();
};

// Machine-to-machine route for agents (API Key protected)
router.post('/sync', requireApiKey, telemetryController.syncLabels);

// Frontend routes for dashboard (JWT protected)
router.get('/labels', protect, telemetryController.getLatestLabels);
router.get('/labels/:assetTag', protect, telemetryController.getLabelHistory);
router.get('/summary', protect, telemetryController.getSummary);

module.exports = router;
