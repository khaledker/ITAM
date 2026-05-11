const svc = require('../services/dashboard.service');

const getSummary = async (req, res, next) => {
  try {
    const [stats, recentMovements, flaggedAssets] = await Promise.all([
      svc.getStats(),
      svc.getRecentMovements(),
      svc.getFlaggedAssets(),
    ]);
    res.json({ stats, recentMovements, flaggedAssets });
  } catch (err) { next(err); }
};

module.exports = { getSummary };
