const db = require('../config/db');

class TelemetryService {
  /**
   * Insert multiple labels (sync from local agent).
   * Resolves asset_tag to asset_id.
   * @param {Array} labels - Array of label objects
   */
  static async syncLabels(labels) {
    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      let insertedCount = 0;

      for (const label of labels) {
        // 1. Try to resolve asset_id from tag or serial_number
        const [assetRows] = await connection.execute(
          'SELECT id FROM Asset WHERE tag = ? OR serial_number = ? LIMIT 1',
          [label.asset_tag, label.asset_tag]
        );

        let asset_id = null;
        if (assetRows.length > 0) {
          asset_id = assetRows[0].id;
        }

        // 2. Insert label
        const query = `
          INSERT INTO DeviceHealthLabel 
            (asset_tag, scored_at, risk_score, risk_level, triggered_rules, recommended_action, asset_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
          label.asset_tag,
          label.scored_at,
          label.risk_score,
          label.risk_level,
          JSON.stringify(label.triggered_rules || []),
          label.recommended_action || '',
          asset_id
        ];

        await connection.execute(query, params);
        insertedCount++;
      }

      await connection.commit();
      return insertedCount;
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Get the latest label for all assets (optionally filtered by risk level)
   */
  static async getLatestLabels(riskLevel = null) {
    let query = `
      SELECT d.*, a.id as asset_id, a.serial_number, a.status as asset_status, 
             am.name as model_name, am.brand, am.category as category_name,
             loc.label as location_name
      FROM DeviceHealthLabel d
      JOIN (
          SELECT asset_tag, MAX(scored_at) as max_scored_at
          FROM DeviceHealthLabel
          GROUP BY asset_tag
      ) latest ON d.asset_tag = latest.asset_tag AND d.scored_at = latest.max_scored_at
      LEFT JOIN Asset a ON d.asset_id = a.id
      LEFT JOIN AssetModel am ON a.model_id = am.id
      LEFT JOIN Location loc ON a.location_id = loc.id
    `;
    
    const params = [];
    if (riskLevel) {
      query += ` WHERE d.risk_level = ?`;
      params.push(riskLevel);
    }
    
    query += ` ORDER BY d.risk_score DESC`;

    const [rows] = await db.query(query, params);
    
    // Parse triggered_rules from JSON
    return rows.map(row => ({
      ...row,
      triggered_rules: typeof row.triggered_rules === 'string' ? JSON.parse(row.triggered_rules) : row.triggered_rules
    }));
  }

  /**
   * Get full label history for a single asset
   */
  static async getLabelHistory(assetTag) {
    const query = `
      SELECT * FROM DeviceHealthLabel
      WHERE asset_tag = ?
      ORDER BY scored_at DESC
    `;
    const [rows] = await db.query(query, [assetTag]);
    
    return rows.map(row => ({
      ...row,
      triggered_rules: typeof row.triggered_rules === 'string' ? JSON.parse(row.triggered_rules) : row.triggered_rules
    }));
  }

  /**
   * Get aggregated telemetry summary
   */
  static async getSummary() {
    const latestLabels = await this.getLatestLabels();
    
    const summary = {
      total_monitored: latestLabels.length,
      healthy: 0,
      watch: 0,
      at_risk: 0,
      critical: 0,
      no_telemetry: 0
    };

    for (const label of latestLabels) {
      if (label.risk_level === 'Healthy') summary.healthy++;
      else if (label.risk_level === 'Watch') summary.watch++;
      else if (label.risk_level === 'At Risk') summary.at_risk++;
      else if (label.risk_level === 'Critical') summary.critical++;
    }

    // Find assets with no telemetry
    const [totalAssetsRows] = await db.query('SELECT COUNT(*) as count FROM Asset');
    const totalAssets = totalAssetsRows[0].count;
    
    summary.no_telemetry = Math.max(0, totalAssets - summary.total_monitored);

    return summary;
  }
}

module.exports = TelemetryService;
