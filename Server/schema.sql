-- ============================================================
-- ASSET MANAGEMENT - FULL DATABASE SETUP
-- Run this once in MySQL Workbench to set everything up
-- ============================================================

CREATE DATABASE IF NOT EXISTS asset_management;
USE asset_management;

-- --------------------------------------------------------
-- INDEPENDENT TABLES
-- --------------------------------------------------------

CREATE TABLE Employee (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL DEFAULT '',
    actif BOOLEAN DEFAULT TRUE
);

CREATE TABLE Department (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    libelle VARCHAR(150) NOT NULL
);

CREATE TABLE Supplier (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    tel VARCHAR(50),
    contact VARCHAR(150)
);

CREATE TABLE Location (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    region VARCHAR(100),
    label VARCHAR(150) NOT NULL,
    site VARCHAR(150),
    type VARCHAR(50) CHECK (type IN ('AdministrativeBlock', 'TrainingRoom', 'Warehouse', 'CallCenter'))
);

CREATE TABLE AssetModel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    brand VARCHAR(100),
    category VARCHAR(100),
    part_number VARCHAR(100)
);

-- --------------------------------------------------------
-- CORE ASSET TABLE
-- --------------------------------------------------------

CREATE TABLE Asset (
    id INT AUTO_INCREMENT PRIMARY KEY,
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    tag VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'Available' CHECK (status IN ('Available', 'Assigned', 'inMaintenance', 'retired')),
    date_acq DATE,
    description VARCHAR(255),
    model_id INT NOT NULL,
    location_id INT,
    FOREIGN KEY (model_id) REFERENCES AssetModel(id),
    FOREIGN KEY (location_id) REFERENCES Location(id)
);

-- --------------------------------------------------------
-- EMPLOYEE → DEPARTMENT
-- --------------------------------------------------------

ALTER TABLE Employee
    ADD COLUMN department_id INT,
    ADD FOREIGN KEY (department_id) REFERENCES Department(id);

-- --------------------------------------------------------
-- ASSET MOVEMENTS
-- --------------------------------------------------------

CREATE TABLE AssetMovement (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Approved', 'Returned', 'Rejected')),
    asset_id INT NOT NULL,
    performed_by INT NOT NULL,
    FOREIGN KEY (asset_id) REFERENCES Asset(id),
    FOREIGN KEY (performed_by) REFERENCES Employee(id)
);

CREATE TABLE Reception (
    id INT PRIMARY KEY,
    purchase_order_number VARCHAR(100),
    receipt_number VARCHAR(100),
    supplier_id INT,
    destination_id INT,
    FOREIGN KEY (id) REFERENCES AssetMovement(id),
    FOREIGN KEY (supplier_id) REFERENCES Supplier(id),
    FOREIGN KEY (destination_id) REFERENCES Location(id)
);

CREATE TABLE Assignment (
    id INT PRIMARY KEY,
    expected_return DATE,
    assigned_to INT,
    source_id INT,
    FOREIGN KEY (id) REFERENCES AssetMovement(id),
    FOREIGN KEY (assigned_to) REFERENCES Employee(id),
    FOREIGN KEY (source_id) REFERENCES Location(id)
);

CREATE TABLE Transfer (
    id INT PRIMARY KEY,
    reference VARCHAR(100),
    source_id INT,
    destination_id INT,
    FOREIGN KEY (id) REFERENCES AssetMovement(id),
    FOREIGN KEY (source_id) REFERENCES Location(id),
    FOREIGN KEY (destination_id) REFERENCES Location(id)
);

CREATE TABLE AssetReturn (
    id INT PRIMARY KEY,
    reason VARCHAR(255),
    returned_to INT,
    FOREIGN KEY (id) REFERENCES AssetMovement(id),
    FOREIGN KEY (returned_to) REFERENCES Location(id)
);

ALTER TABLE Employee
  ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'Employee'
    CHECK (role IN ('Admin', 'Manager', 'Employee')) AFTER password;
-- ============================================================
-- DONE! All tables created successfully.
-- ============================================================