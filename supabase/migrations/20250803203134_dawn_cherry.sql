/*
  # Add proposal fields to bookings table

  1. New Columns
    - `proposed_hours` (numeric, freelancer's proposed hours)
    - `proposed_due_date` (date, freelancer's proposed due date)
    - `proposed_total` (numeric, calculated total for proposal)
    - `provider_notes` (text, freelancer's additional notes)

  2. Changes
    - Add new columns to existing bookings table
    - Set default values for existing records
    - Update existing records to have proper defaults

  3. Notes
    - These fields are used when freelancer accepts a booking request
    - Allows negotiation between client and freelancer
    - Supports the booking workflow: pending → pending-buyer → confirmed
*/

-- Add new columns for freelancer proposals
DO $$
BEGIN
  -- Add proposed_hours column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'proposed_hours'
  ) THEN
    ALTER TABLE bookings ADD COLUMN proposed_hours numeric DEFAULT NULL;
  END IF;

  -- Add proposed_due_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'proposed_due_date'
  ) THEN
    ALTER TABLE bookings ADD COLUMN proposed_due_date date DEFAULT NULL;
  END IF;

  -- Add proposed_total column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'proposed_total'
  ) THEN
    ALTER TABLE bookings ADD COLUMN proposed_total numeric DEFAULT NULL;
  END IF;

  -- Add provider_notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'provider_notes'
  ) THEN
    ALTER TABLE bookings ADD COLUMN provider_notes text DEFAULT '';
  END IF;
END $$;

-- Update the status check constraint to include new statuses
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookings_status_check' AND table_name = 'bookings'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
  END IF;

  -- Add updated constraint with new statuses
  ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
    CHECK (status IN (
      'pending', 
      'pending-freelancer', 
      'pending-buyer', 
      'confirmed', 
      'in-progress', 
      'awaiting-review', 
      'completed', 
      'declined', 
      'disputed', 
      'cancelled'
    ));
END $$;