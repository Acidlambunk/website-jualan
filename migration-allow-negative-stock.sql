-- Migration: Allow Negative Stock for Tracking Backorders
-- Run this in your Supabase SQL Editor to update the existing database

-- Step 1: Drop the CHECK constraint on stock_quantity
-- This allows stock_quantity to go negative for tracking backorders
ALTER TABLE product_colors DROP CONSTRAINT IF EXISTS product_colors_stock_quantity_check;

-- Step 2: Verify the change by checking the table constraints
-- You can run this query to confirm the constraint was removed:
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'product_colors'::regclass;

-- That's it! Your database now allows negative stock values.
-- The reserved_quantity constraint remains to prevent negative reservations.

-- Summary of changes:
-- ✓ stock_quantity can now be negative (tracks backorders)
-- ✓ reserved_quantity still cannot be negative (prevents invalid reservations)
-- ✓ available_quantity = stock_quantity - reserved_quantity (can be negative)
