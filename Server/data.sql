-- ============================================================
-- ITAM DUMMY DATA  –  Full test seed
-- Covers: Employee, Department, Supplier, Location, AssetModel,
--         Asset, AssetMovement, Reception, Assignment,
--         Transfer, AssetReturn
--
-- Passwords (bcrypt, 10 rounds):
--   Admin@1234  → used for id=1 (admin.sys)
--   Pass@1234   → used for all other employees
--
-- Run AFTER schema.sql:
--   mysql -u root -p itam < data.sql
-- ============================================================

USE itam;

-- ── Wipe in reverse FK order ─────────────────────────────
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE ManagerPermission;
TRUNCATE TABLE ManagerLocation;
TRUNCATE TABLE AssetReturn;
TRUNCATE TABLE Transfer;
TRUNCATE TABLE Assignment;
TRUNCATE TABLE Reception;
TRUNCATE TABLE MovementItem;
TRUNCATE TABLE AssetMovement;
TRUNCATE TABLE Asset;
TRUNCATE TABLE Employee;
TRUNCATE TABLE Users;
TRUNCATE TABLE AssetModel;
TRUNCATE TABLE Location;
TRUNCATE TABLE Supplier;
TRUNCATE TABLE Department;
SET FOREIGN_KEY_CHECKS = 1;

-- ────────────────────────────────────────────────────────
-- 1. DEPARTMENTS  (4 rows)
-- ────────────────────────────────────────────────────────
INSERT INTO Department (id, code, libelle) VALUES
(1, 'IT',      'Information Technology'),
(2, 'HR',      'Human Resources'),
(3, 'FIN',     'Finance & Accounting'),
(4, 'MKT',     'Marketing & Communications');

-- ────────────────────────────────────────────────────────
-- 2. SUPPLIERS  (3 rows)
-- ────────────────────────────────────────────────────────
INSERT INTO Supplier (id, name, code, tel, contact) VALUES
(1, 'TechSupply DZ',   'SUP-TS',  '021-00-01-11', 'Nadia Bouali'),
(2, 'Global Devices',  'SUP-GD',  '021-00-02-22', 'Yacine Ferhat'),
(3, 'AlgeriaTech Pro', 'SUP-ATP', '031-00-03-33', 'Samira Khelif');

-- ────────────────────────────────────────────────────────
-- 3. LOCATIONS  (5 rows – all 4 allowed types)
-- ────────────────────────────────────────────────────────
INSERT INTO Location (id, code, region, label, site, type) VALUES
(1, 'WH-ALG',   'Algiers', 'Main Warehouse',       'HQ',       'Warehouse'),
(2, 'ADM-ALG',  'Algiers', 'Admin Block A',         'HQ',       'AdministrativeBlock'),
(3, 'CC-ORN',   'Oran',    'Admin Block Oran',      'Oran Site','AdministrativeBlock'),
(4, 'TR-BLI',   'Blida',   'Warehouse Blida',       'Blida Site','Warehouse'),
(5, 'WH-ORN',   'Oran',    'Oran Warehouse',        'Oran Site','Warehouse');

-- ────────────────────────────────────────────────────────
-- 4. ASSET MODELS  (5 rows – mixed categories)
-- ────────────────────────────────────────────────────────
INSERT INTO AssetModel (id, name, code, brand, category, part_number) VALUES
(1, 'Latitude 5420',     'MOD-L5420',  'Dell',    'Laptop',   'DL-5420'),
(2, 'ThinkCentre M70q',  'MOD-M70Q',   'Lenovo',  'Desktop',  'LN-M70Q'),
(3, 'LaserJet Pro 400',  'MOD-LJ400',  'HP',      'Printer',  'HP-LJ400'),
(4, 'EliteBook 840 G9',  'MOD-EB840',  'HP',      'Laptop',   'HP-840G9'),
(5, 'UltraSharp U2422H', 'MOD-U2422',  'Dell',    'Monitor',  'DL-U2422');

-- ────────────────────────────────────────────────────────
-- 5. USERS AND EMPLOYEES
--    id=1 Admin
--    id=2 Manager
--    id=3 User
-- ────────────────────────────────────────────────────────
INSERT INTO Users (id, user_name, full_name, email, password, status, role) VALUES
(1, 'admin.sys',   'System Administrator', 'admin@itam.local',
    '$2b$10$GKFcFbH7GYLKCr7XrnC5T.K7I1hlB1yiKSmZP3N5OsEKRCY9F1qd6',  -- Admin@1234
    'active', 'Admin'),
(2, 'm.belkacem',  'Mohamed Belkacem',     'm.belkacem@itam.local',
    '$2b$10$XKmqzFEAUvIRq3LgCJJBm.XhunJedjBLaELH6DZX8b9/SNx1Vq8Dy',  -- Pass@1234
    'active', 'Manager'),
(3, 'k.user',      'Karim User',           'k.user@itam.local',
    '$2b$10$XKmqzFEAUvIRq3LgCJJBm.XhunJedjBLaELH6DZX8b9/SNx1Vq8Dy',  -- Pass@1234
    'active', 'User');

INSERT INTO Employee (id, full_name, email, department_id) VALUES
(3, 'Sofia Rahmani', 's.rahmani@itam.local', 2),
(4, 'Karim Haddad',  'k.haddad@itam.local',  1),
(5, 'Amira Mekki',   'a.mekki@itam.local',   3),
(6, 'Riad Bouzid',   'r.bouzid@itam.local',  4),
(7, 'Leila Hamza',   'l.hamza@itam.local',   2);

INSERT INTO ManagerPermission (user_id, permission) VALUES
(2, 'consultation'), (2, 'reception'), (2, 'assignment'), (2, 'transfer'), (2, 'return');

INSERT INTO ManagerLocation (user_id, location_id) VALUES
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5);

-- ────────────────────────────────────────────────────────
-- 6. ASSETS  (10 rows – all 4 statuses represented)
--
--  employee_id is set on rows whose status='Assigned'
--  to match the Approved Assignment movements below.
-- ────────────────────────────────────────────────────────
INSERT INTO Asset (id, serial_number, tag, status, date_acq, description, model_id, location_id, employee_id) VALUES
-- Assigned laptops
(1,  'SN-LAP-0001', 'TAG-0001', 'Assigned',      '2025-03-10', 'Laptop – Sofia',          1, 2, 3),
(2,  'SN-LAP-0002', 'TAG-0002', 'Assigned',      '2025-04-05', 'Laptop – Karim',          1, 2, 4),
-- Available stock
(3,  'SN-DESK-003', 'TAG-0003', 'Available',     '2026-01-12', 'Desktop in stock',         2, 1, NULL),
(4,  'SN-DESK-004', 'TAG-0004', 'Available',     '2026-01-20', 'Spare desktop',            2, 1, NULL),
-- In Maintenance
(5,  'SN-PRN-005',  'TAG-0005', 'inMaintenance', '2025-06-15', 'Office printer – servicing',3, 1, NULL),
-- Retired
(6,  'SN-MON-006',  'TAG-0006', 'retired',       '2022-07-01', 'Old monitor – retired',   5, 1, NULL),
-- Assigned laptop (Amira)
(7,  'SN-EB-0007',  'TAG-0007', 'Assigned',      '2025-08-20', 'Laptop – Amira',          4, 3, 5),
-- Available (recently received – Draft movement not yet approved)
(8,  'SN-MON-008',  'TAG-0008', 'Available',     '2026-04-01', 'New monitor – pending check',5, 1, NULL),
-- OLD assets (> 1 yr) to trigger dashboard getFlaggedAssets
(9,  'SN-LAP-0009', 'TAG-0009', 'Available',     '2023-02-14', 'Old spare laptop',        1, 1, NULL),
(10, 'SN-DESK-010', 'TAG-0010', 'inMaintenance', '2022-11-30', 'Very old desktop',        2, 1, NULL);

-- ────────────────────────────────────────────────────────
-- 7. ASSET MOVEMENTS  (12 rows)
--    Types: Reception(R), Assignment(A), Transfer(T), Return(Ret)
--    Statuses: Approved, Draft, Returned, Rejected
-- ────────────────────────────────────────────────────────
INSERT INTO AssetMovement (id, date, status, performed_by) VALUES
-- Receptions
( 1, '2025-03-01', 'Approved', 1),   -- A1 received → WH
( 2, '2025-04-01', 'Approved', 1),   -- A2 received → WH
( 3, '2026-01-12', 'Approved', 2),   -- A3 received → WH
( 4, '2026-01-20', 'Approved', 2),   -- A4 received → WH
( 5, '2025-06-10', 'Approved', 1),   -- A5 received → WH
( 6, '2026-04-01', 'Draft',    2),   -- A8 reception PENDING
-- Assignments
( 7, '2025-03-15', 'Approved', 2),   -- A1 → Sofia (emp 3)
( 8, '2025-04-10', 'Approved', 2),   -- A2 → Karim (emp 4)
( 9, '2025-09-01', 'Approved', 2),   -- A7 → Amira (emp 5)
(10, '2026-05-01', 'Draft',    2),   -- A3 assignment PENDING (Draft)
-- Transfer
(11, '2025-08-15', 'Approved', 1),   -- A5 transferred WH → Oran WH (before maintenance)
-- Return
(12, '2026-03-10', 'Draft',    3);   -- Karim initiated return of A2 – not yet approved

INSERT INTO MovementItem (movement_id, asset_id) VALUES
(1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 8),
(7, 1), (8, 2), (9, 7), (10, 3),
(11, 5), (12, 2);

-- ────────────────────────────────────────────────────────
-- 8. RECEPTION  (sub-type rows matching reception movements)
-- ────────────────────────────────────────────────────────
INSERT INTO Reception (id, purchase_order_number, receipt_number, supplier_id, destination_id) VALUES
(1, 'PO-2025-001', 'RCPT-2025-001', 1, 1),   -- A1 → Main Warehouse
(2, 'PO-2025-002', 'RCPT-2025-002', 1, 1),   -- A2 → Main Warehouse
(3, 'PO-2026-001', 'RCPT-2026-001', 2, 1),   -- A3 → Main Warehouse
(4, 'PO-2026-002', 'RCPT-2026-002', 2, 1),   -- A4 → Main Warehouse
(5, 'PO-2025-003', 'RCPT-2025-003', 3, 1),   -- A5 → Main Warehouse
(6, 'PO-2026-004', 'RCPT-2026-004', 2, 1);   -- A8 → Draft pending

-- ────────────────────────────────────────────────────────
-- 9. ASSIGNMENT  (Approved + Draft)
-- ────────────────────────────────────────────────────────
INSERT INTO Assignment (id, expected_return, assigned_to, source_id) VALUES
( 7, '2025-12-31', 3, 1),   -- A1 → Sofia,  from Main Warehouse (Approved)
( 8, '2025-12-31', 4, 1),   -- A2 → Karim,  from Main Warehouse (Approved)
( 9, '2026-06-30', 5, 1),   -- A7 → Amira,  from Main Warehouse (Approved)
(10, '2026-12-31', 3, 1);   -- A3 → Sofia pending (Draft)

-- ────────────────────────────────────────────────────────
-- 10. TRANSFER  (A5: WH-ALG → WH-ORN, Approved)
-- ────────────────────────────────────────────────────────
INSERT INTO Transfer (id, reference, source_id, destination_id) VALUES
(11, 'TR-2025-001', 1, 5);   -- Main Warehouse → Oran Warehouse

-- ────────────────────────────────────────────────────────
-- 11. ASSET RETURN  (Karim returning A2, Draft)
-- ────────────────────────────────────────────────────────
INSERT INTO AssetReturn (id, reason, returned_to) VALUES
(12, 'Employee leaving department', 1);  -- returned to Main Warehouse

-- ============================================================
-- SUMMARY OF TESTABLE SCENARIOS
-- ============================================================
-- employee.service:
--   findAll()             → 7 employees (mix of roles/depts)
--   findById(3)           → Sofia Rahmani, IT dept
--   create(...)           → add new employee via API
--   update(6, ...)        → update inactive Riad Bouzid
--   remove(7)             → delete Leila Hamza
--   updateRole(3,'Manager') → promote Sofia
--   getAssignedAssets(3)  → A1 (Approved assignment, Assigned status)
--   getAssignedAssets(4)  → A2 (same)
--   getAssignedAssets(5)  → A7 (same)
--
-- asset.service:
--   findAll()             → 10 assets
--   findAll({status:'Assigned'})      → 3 (A1,A2,A7)
--   findAll({category:'Laptop'})      → 4 (A1,A2,A7,A9)
--   findAll({employee_id:3})          → A1
--   getMovementHistory(1)             → Reception+Assignment
--   getMovementHistory(5)             → Reception+Transfer
--   getStats()            → total=10, available=4, assigned=3, inMaintenance=2, retired=1
--
-- movement.service:
--   findAll()                         → 12 movements
--   findAll({type:'Reception'})       → 6
--   findAll({type:'Assignment'})      → 4
--   findAll({status:'Draft'})         → 3 (mv6, mv10, mv12)
--   findAll({status:'Approved'})      → 9
--   findById(7)                       → Assignment detail (Sofia)
--   createReception(...)              → new Draft reception
--   createAssignment(...)             → new Draft assignment
--   createTransfer(...)               → new Draft transfer
--   createReturn(...)                 → new Draft return
--   updateStatus(6,'Approved')        → approve A8 reception → Available
--   updateStatus(10,'Approved')       → approve A3 assignment → Assigned
--   updateStatus(12,'Approved')       → approve return → A2 Available
--   updateStatus(10,'Rejected')       → reject assignment
--
-- dashboard.service:
--   getStats()            → KPI counts
--   getRecentMovements()  → last 10 movements
--   getFlaggedAssets()    → A5(inMaintenance), A6(retired-old), A9(>1yr), A10(>3yr critical)
--
-- department / supplier / location / assetModel services:
--   All support findAll, findById, create, update, remove
-- ============================================================
