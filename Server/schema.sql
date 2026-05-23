-- ============================================================
-- ASSET MANAGEMENT - FULL DATABASE SETUP
-- Matches UML Class Diagram exactly
-- ============================================================

DROP DATABASE IF EXISTS itam;
CREATE DATABASE itam;
USE itam;

-- --------------------------------------------------------
-- 1. DEPARTMENT
--    (no dependencies)
-- --------------------------------------------------------

CREATE TABLE Department (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    code    VARCHAR(50)  NOT NULL UNIQUE,
    libelle VARCHAR(150) NOT NULL
);

-- --------------------------------------------------------
-- 2. SUPPLIER
--    (no dependencies)
-- --------------------------------------------------------

CREATE TABLE Supplier (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    name    VARCHAR(150) NOT NULL,
    code    VARCHAR(50)  NOT NULL UNIQUE,
    tel     VARCHAR(50),
    contact VARCHAR(150)
);

-- --------------------------------------------------------
-- 3. LOCATION
--    Enum: AdministrativeBlock | TrainingRoom | Warehouse | CallCenter
-- --------------------------------------------------------

CREATE TABLE Location (
    id     INT AUTO_INCREMENT PRIMARY KEY,
    code   VARCHAR(50)  NOT NULL UNIQUE,
    region VARCHAR(100),
    label  VARCHAR(150) NOT NULL,
    site   VARCHAR(150),
    type   VARCHAR(50)
        CHECK (type IN ('AdministrativeBlock', 'TrainingRoom', 'Warehouse', 'CallCenter'))
);

-- --------------------------------------------------------
-- 4. ASSET MODEL
--    (no dependencies)
-- --------------------------------------------------------

CREATE TABLE AssetModel (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    brand       VARCHAR(100),
    category    VARCHAR(100),
    part_number VARCHAR(100)
);

-- --------------------------------------------------------
-- 5. EMPLOYEE  (depends on Department)
--    role enum: Admin | Manager | Employee
-- --------------------------------------------------------

CREATE TABLE Employee (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_name     VARCHAR(100) NOT NULL UNIQUE,
    full_name     VARCHAR(150) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL DEFAULT '',
    status        VARCHAR(20)  NOT NULL DEFAULT 'active'
                      CHECK (status IN ('pending', 'active', 'rejected')),
    role          VARCHAR(50)  NOT NULL DEFAULT 'Employee'
                      CHECK (role IN ('Admin', 'Manager', 'Employee')),
    department_id INT,
    reviewed_by   INT,
    reviewed_at   TIMESTAMP NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES Department(id)
);

-- --------------------------------------------------------
-- 6. ASSET  (depends on AssetModel, Location, Employee)
--    status enum: Available | Assigned | inMaintenance | retired
-- --------------------------------------------------------

CREATE TABLE Asset (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    tag           VARCHAR(100) NOT NULL UNIQUE,
    status        VARCHAR(50)  DEFAULT 'Available'
                      CHECK (status IN ('Available', 'Assigned', 'inMaintenance', 'retired')),
    date_acq      DATE,
    description   VARCHAR(255),
    model_id      INT NOT NULL,
    location_id   INT,
    employee_id   INT,
    FOREIGN KEY (model_id)    REFERENCES AssetModel(id),
    FOREIGN KEY (location_id) REFERENCES Location(id),
    FOREIGN KEY (employee_id) REFERENCES Employee(id) ON DELETE SET NULL
);

-- --------------------------------------------------------
-- 7. ASSET MOVEMENT  (depends on Asset, Employee)
--    status enum: Draft | Approved | Returned | Rejected
-- --------------------------------------------------------

CREATE TABLE AssetMovement (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    date         DATE        NOT NULL,
    status       VARCHAR(50) DEFAULT 'Draft'
                     CHECK (status IN ('Draft', 'Approved', 'Returned', 'Rejected')),
    performed_by INT NOT NULL,
    FOREIGN KEY (performed_by) REFERENCES Employee(id)
);

CREATE TABLE MovementItem (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    movement_id INT NOT NULL,
    asset_id    INT NOT NULL,
    FOREIGN KEY (movement_id) REFERENCES AssetMovement(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id)    REFERENCES Asset(id)
);

-- --------------------------------------------------------
-- 8. RECEPTION  (sub-type of AssetMovement)
--    "supplied by" → Supplier
--    "destination"  → Location
-- --------------------------------------------------------

CREATE TABLE Reception (
    id                    INT PRIMARY KEY,
    purchase_order_number VARCHAR(100),
    receipt_number        VARCHAR(100),
    supplier_id           INT,
    destination_id        INT,
    FOREIGN KEY (id)             REFERENCES AssetMovement(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id)    REFERENCES Supplier(id),
    FOREIGN KEY (destination_id) REFERENCES Location(id)
);

-- --------------------------------------------------------
-- 9. ASSIGNMENT  (sub-type of AssetMovement)
--    "source"      → Location
--    "assigned to" → Employee
-- --------------------------------------------------------

CREATE TABLE Assignment (
    id              INT PRIMARY KEY,
    expected_return DATE,
    assigned_to     INT,
    source_id       INT,
    FOREIGN KEY (id)          REFERENCES AssetMovement(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES Employee(id),
    FOREIGN KEY (source_id)   REFERENCES Location(id)
);

-- --------------------------------------------------------
-- 10. TRANSFER  (sub-type of AssetMovement)
--     "source"      → Location
--     "destination" → Location
-- --------------------------------------------------------

CREATE TABLE Transfer (
    id             INT PRIMARY KEY,
    reference      VARCHAR(100),
    source_id      INT,
    destination_id INT,
    FOREIGN KEY (id)             REFERENCES AssetMovement(id) ON DELETE CASCADE,
    FOREIGN KEY (source_id)      REFERENCES Location(id),
    FOREIGN KEY (destination_id) REFERENCES Location(id)
);

-- --------------------------------------------------------
-- 11. ASSET RETURN  (sub-type of AssetMovement)
--     "returned to" → Location
-- --------------------------------------------------------

CREATE TABLE AssetReturn (
    id          INT PRIMARY KEY,
    reason      VARCHAR(255),
    returned_to INT,
    FOREIGN KEY (id)          REFERENCES AssetMovement(id) ON DELETE CASCADE,
    FOREIGN KEY (returned_to) REFERENCES Location(id)
);
-- --------------------------------------------------------
-- 12. MANAGER PERMISSION  (granular functionality per manager)
-- --------------------------------------------------------

CREATE TABLE ManagerPermission (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    employee_id   INT NOT NULL,
    permission    VARCHAR(50) NOT NULL
                      CHECK (permission IN ('consultation', 'reception', 'assignment', 'transfer', 'return')),
    UNIQUE KEY uq_mgr_perm (employee_id, permission),
    FOREIGN KEY (employee_id) REFERENCES Employee(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- 13. MANAGER LOCATION  (regional / warehouse scoping)
-- --------------------------------------------------------

CREATE TABLE ManagerLocation (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    employee_id   INT NOT NULL,
    location_id   INT NOT NULL,
    UNIQUE KEY uq_mgr_loc (employee_id, location_id),
    FOREIGN KEY (employee_id) REFERENCES Employee(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES Location(id) ON DELETE CASCADE
);

-- ============================================================
-- DONE. All 13 tables match the UML Class Diagram + RBAC.
-- ============================================================