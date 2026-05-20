const db = require('../config/db');

// ── KPI Stats ─────────────────────────────────────────────
const getStats = async () => {
  const [rows] = await db.query(`
    SELECT
      COUNT(*)                            AS total,
      SUM(status = 'Available')           AS available,
      SUM(status = 'Assigned')            AS assigned,
      SUM(status IN ('inMaintenance',
                     'Maintenance'))      AS in_maintenance
    FROM Asset
  `);
  return rows[0];
};

// ── Recent Movements (last 10) ────────────────────────────
const getRecentMovements = async () => {
  const [rows] = await db.query(`
    SELECT
      mv.id,
      mv.date,
      mv.status,
      SUBSTRING_INDEX(GROUP_CONCAT(a.tag ORDER BY a.tag), ',', 3) AS asset_tag,
      COUNT(mi.asset_id) AS asset_count,
      e.full_name AS performed_by,
      CASE
        WHEN r.id   IS NOT NULL THEN 'Reception'
        WHEN asn.id IS NOT NULL THEN 'Assignment'
        WHEN t.id   IS NOT NULL THEN 'Transfer'
        WHEN ar.id  IS NOT NULL THEN 'Return'
      END AS type
    FROM AssetMovement mv
    JOIN MovementItem mi ON mi.movement_id = mv.id
    JOIN Asset a ON a.id = mi.asset_id
    JOIN Employee e ON e.id = mv.performed_by
    LEFT JOIN Reception   r   ON r.id   = mv.id
    LEFT JOIN Assignment  asn ON asn.id = mv.id
    LEFT JOIN Transfer    t   ON t.id   = mv.id
    LEFT JOIN AssetReturn ar  ON ar.id  = mv.id
    GROUP BY mv.id
    ORDER BY mv.date DESC, mv.id DESC
    LIMIT 10
  `);
  return rows;
};

// ── Maintenance Predictions ───────────────────────────────
// Flag assets that are "inMaintenance" or were acquired > 1 year ago
const getFlaggedAssets = async () => {
  const [rows] = await db.query(`
    SELECT
      a.id,
      a.tag,
      a.status,
      a.date_acq,
      am.name  AS model_name,
      am.category,
      DATEDIFF(CURDATE(), a.date_acq) AS age_days
    FROM Asset a
    JOIN AssetModel am ON am.id = a.model_id
    WHERE
      a.status IN ('inMaintenance', 'Maintenance')
      OR DATEDIFF(CURDATE(), a.date_acq) > 365
    ORDER BY age_days DESC
    LIMIT 8
  `);

  return rows.map((r) => {
    let rule = 'Under maintenance';
    let riskLevel = 'medium';

    if (r.status === 'inMaintenance' || r.status === 'Maintenance') {
      rule = 'Currently in maintenance';
      riskLevel = 'high';
    }
    if (r.age_days > 1095) { // > 3 years
      rule = 'Age > 3 years';
      riskLevel = 'critical';
    } else if (r.age_days > 730) { // > 2 years
      rule = 'Age > 2 years';
      riskLevel = 'high';
    } else if (r.age_days > 365) { // > 1 year
      rule = 'Age > 1 year';
      riskLevel = 'medium';
    }

    return {
      id: r.id,
      assetTag: r.tag,
      assetName: r.model_name,
      category: r.category,
      rule,
      riskLevel,
      ageDays: r.age_days,
    };
  });
};

module.exports = { getStats, getRecentMovements, getFlaggedAssets };
