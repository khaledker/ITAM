const TelemetryService = require('../services/telemetry.service');

exports.syncLabels = async (req, res, next) => {
  try {
    const labels = req.body;
    
    if (!Array.isArray(labels)) {
      return res.status(400).json({ message: 'Request body must be an array of labels' });
    }

    const insertedCount = await TelemetryService.syncLabels(labels);
    
    return res.status(200).json({ 
      status: 'ok', 
      message: `Successfully synced ${insertedCount} labels`,
      count: insertedCount
    });
  } catch (err) {
    next(err);
  }
};

exports.getLatestLabels = async (req, res, next) => {
  try {
    const { risk_level } = req.query;
    const labels = await TelemetryService.getLatestLabels(risk_level);
    res.json(labels);
  } catch (err) {
    next(err);
  }
};

exports.getLabelHistory = async (req, res, next) => {
  try {
    const { assetTag } = req.params;
    if (!assetTag) {
      return res.status(400).json({ message: 'Asset tag is required' });
    }
    const history = await TelemetryService.getLabelHistory(assetTag);
    res.json(history);
  } catch (err) {
    next(err);
  }
};

exports.getSummary = async (req, res, next) => {
  try {
    const summary = await TelemetryService.getSummary();
    res.json(summary);
  } catch (err) {
    next(err);
  }
};
