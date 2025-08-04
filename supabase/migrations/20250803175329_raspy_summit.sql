/*
  # Create bookings table for freelancing platform

  1. New Tables
    - `bookings`
      - `id` (uuid, primary key)
      - `service_id` (text, references services)
      - `service_title` (text, for display)
      - `service_provider_id` (text, references users)
      - `client_id` (text, references users)
      - `client_email` (text, for display)
      - `hourly_rate` (numeric, rate at time of booking)
      - `estimated_hours` (numeric, estimated project duration)
      - `total_estimate` (numeric, calculated estimate)
      - `preferred_start_date` (date, when client wants to start)
      - `notes` (text, project requirements)
      - `status` (text, booking status)
      - `provider_notes` (text, optional notes from provider)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `bookings` table
    - Add policies for clients to read their own bookings
    - Add policies for service providers to read bookings for their services
    - Add policies for authenticated users to create bookings
    - Add policies for service providers to update booking status

  3. Indexes
    - Index on client_id for fast client booking lookups
    - Index on service_provider_id for fast provider booking lookups
    - Index on status for filtering by booking status
</*/

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id text NOT NULL,
  service_title text NOT NULL,
  service_provider_id text NOT NULL,
  client_id text NOT NULL,
  client_email text NOT NULL,
  hourly_rate numeric DEFAULT 0,
  estimated_hours numeric DEFAULT 1,
  total_estimate numeric DEFAULT 0,
  preferred_start_date date NOT NULL,
  notes text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in-progress', 'completed', 'cancelled')),
  provider_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policies for clients to manage their own bookings
CREATE POLICY "Clients can read their own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = client_id);

CREATE POLICY "Clients can create bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = client_id);

CREATE POLICY "Clients can update their own bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = client_id);

-- Policies for service providers to manage bookings for their services
CREATE POLICY "Service providers can read bookings for their services"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = service_provider_id);

CREATE POLICY "Service providers can update bookings for their services"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = service_provider_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_provider_id ON bookings(service_provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_bookings_updated_at'
  ) THEN
    CREATE TRIGGER update_bookings_updated_at
      BEFORE UPDATE ON bookings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;