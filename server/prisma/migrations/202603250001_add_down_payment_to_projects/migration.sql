-- Safe additive migration: nullable column, preserves all existing rows/data.
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS "downPayment" INTEGER;
