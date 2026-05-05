-- Run this migration to add password support to the Employee table
-- Required for JWT authentication

ALTER TABLE Employee
  ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT '' AFTER email;

-- After running this, use the /api/auth/register endpoint
-- (or manually insert employees with a hashed password via bcrypt)
