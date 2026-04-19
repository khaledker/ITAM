-- --------------------------------------------------------
-- DUMMY DATA FOR TESTING
-- --------------------------------------------------------

USE itam;

INSERT INTO Department (id, code, libelle) VALUES
(1, 'IT', 'IT Department'),
(2, 'HR', 'Human Resources');

INSERT INTO Employee (id, user_name, full_name, email, actif, department_id) VALUES
(1, 'admin.itam', 'Admin ITAM', 'admin@itam.local', TRUE, 1),
(2, 'm.belkacem', 'Mohamed Belkacem', 'm.belkacem@itam.local', TRUE, 1),
(3, 's.rahmani', 'Sofia Rahmani', 's.rahmani@itam.local', TRUE, 2),
(4, 'k.haddad', 'Karim Haddad', 'k.haddad@itam.local', TRUE, 1);

INSERT INTO Location (id, code, region, label, site, type) VALUES
(1, 'WH-ALG', 'Algiers', 'Main Warehouse', 'HQ', 'Warehouse'),
(2, 'ADM-ALG', 'Algiers', 'Admin Block A', 'HQ', 'AdministrativeBlock'),
(3, 'CC-ORN', 'Oran', 'Call Center Oran', 'Oran Site', 'CallCenter');

INSERT INTO Supplier (id, name, code, tel, contact) VALUES
(1, 'TechSupply DZ', 'SUP-TS', '021000111', 'Nadia'),
(2, 'Global Devices', 'SUP-GD', '021000222', 'Yacine');

INSERT INTO AssetModel (id, name, code, brand, category, part_number) VALUES
(1, 'Latitude 5420', 'MOD-L5420', 'Dell', 'Laptop', 'DL-5420'),
(2, 'ThinkCentre M70', 'MOD-M70', 'Lenovo', 'Desktop', 'LN-M70'),
(3, 'LaserJet Pro 400', 'MOD-LJ400', 'HP', 'Printer', 'HP-LJ400');

INSERT INTO Asset (id, serial_number, tag, status, date_acq, description, model_id, location_id) VALUES
(1, 'SN-LAP-0001', 'TAG-0001', 'Assigned', '2026-01-10', 'Laptop for employee use', 1, 2),
(2, 'SN-DESK-0002', 'TAG-0002', 'Available', '2026-01-12', 'Desktop in stock', 2, 1),
(3, 'SN-PRN-0003', 'TAG-0003', 'inMaintenance', '2026-01-15', 'Office printer', 3, 1),
(4, 'SN-LAP-0004', 'TAG-0004', 'Available', '2026-01-20', 'Spare laptop', 1, 1);

INSERT INTO AssetMovement (id, date, status, asset_id, performed_by) VALUES
(1, '2026-02-01', 'Approved', 2, 1),
(2, '2026-02-03', 'Approved', 1, 1),
(3, '2026-02-10', 'Approved', 4, 4),
(4, '2026-02-15', 'Returned', 3, 2);

INSERT INTO Reception (id, purchase_order_number, receipt_number, supplier_id, destination_id) VALUES
(1, 'PO-2026-001', 'RCPT-2026-001', 1, 1);

INSERT INTO Assignment (id, expected_return, assigned_to, source_id) VALUES
(2, '2026-12-31', 2, 1);

INSERT INTO Transfer (id, reference, source_id, destination_id) VALUES
(3, 'TR-2026-001', 1, 3);

INSERT INTO AssetReturn (id, reason, returned_to) VALUES
(4, 'Printer malfunction', 1);
