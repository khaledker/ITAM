const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

const authRoutes       = require('./routes/auth.routes');
const employeeRoutes   = require('./routes/employee.routes');
const departmentRoutes = require('./routes/department.routes');
const supplierRoutes   = require('./routes/supplier.routes');
const locationRoutes   = require('./routes/location.routes');
const assetModelRoutes = require('./routes/assetModel.routes');
const assetRoutes      = require('./routes/asset.routes');
const movementRoutes   = require('./routes/movement.routes');

const app = express();

// ── Middleware ────────────────────────────────────────────
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// ── Routes ───────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/employees',    employeeRoutes);
app.use('/api/departments',  departmentRoutes);
app.use('/api/suppliers',    supplierRoutes);
app.use('/api/locations',    locationRoutes);
app.use('/api/asset-models', assetModelRoutes);
app.use('/api/assets',       assetRoutes);
app.use('/api/movements',    movementRoutes);

// ── Health check ─────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── Error handler (must be last) ─────────────────────────
app.use(errorHandler);

module.exports = app;
