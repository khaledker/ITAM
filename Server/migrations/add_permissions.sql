-- ============================================================
-- MIGRATION: Add Permission System
-- Adds ManagerLocation and ManagerPermission tables
-- Run AFTER schema.sql + data.sql:
--   mysql -u root -p itam < migrations/add_permissions.sql
-- ============================================================

USE itam;

-- ────────────────────────────────────────────────────────
-- 1. MANAGER ↔ LOCATION mapping
--    Controls which locations a Manager can operate on.
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ManagerLocation (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    location_id INT NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES Employee(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES Location(id) ON DELETE CASCADE,
    UNIQUE KEY uq_emp_loc (employee_id, location_id)
);

-- ────────────────────────────────────────────────────────
-- 2. MANAGER ↔ PERMISSION mapping
--    Controls which functionalities a Manager can use.
--    Valid values: consultation, reception, assignment,
--                  transfer, return
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ManagerPermission (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    permission  VARCHAR(50) NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES Employee(id) ON DELETE CASCADE,
    UNIQUE KEY uq_emp_perm (employee_id, permission)
);

-- ────────────────────────────────────────────────────────
-- 3. SEED: Give m.belkacem (id=2) sample permissions
-- ────────────────────────────────────────────────────────

-- Locations: Main Warehouse (1) + Admin Block A (2)
INSERT IGNORE INTO ManagerLocation (employee_id, location_id) VALUES
(2, 1),
(2, 2);

-- Permissions: consultation + reception + assignment
INSERT IGNORE INTO ManagerPermission (employee_id, permission) VALUES
(2, 'consultation'),
(2, 'reception'),
(2, 'assignment');

-- ============================================================
-- DONE. Two new tables + seed data for existing Manager.
-- ============================================================
