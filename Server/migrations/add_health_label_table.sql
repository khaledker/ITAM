-- Migration: Add DeviceHealthLabel table
-- Creates the table if it does not exist

CREATE TABLE IF NOT EXISTS DeviceHealthLabel (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    asset_tag          VARCHAR(100) NOT NULL,
    scored_at          DATETIME     NOT NULL,
    risk_score         DECIMAL(6,2) NOT NULL,
    risk_level         VARCHAR(20)  NOT NULL
                           CHECK (risk_level IN ('Healthy','Watch','At Risk','Critical')),
    triggered_rules    JSON,
    recommended_action TEXT,
    asset_id           INT,
    created_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES Asset(id) ON DELETE SET NULL,
    INDEX idx_label_asset_tag (asset_tag),
    INDEX idx_label_risk (risk_level),
    INDEX idx_label_scored (scored_at)
);
