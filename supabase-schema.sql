-- Create reports table for StatusNow
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id TEXT NOT NULL,
  wait_bucket TEXT NOT NULL CHECK (wait_bucket IN ('<15', '15-30', '30+')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient queries by clinic_id and created_at
CREATE INDEX IF NOT EXISTS idx_reports_clinic_created 
ON reports(clinic_id, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read reports (public read)
CREATE POLICY "Allow public read access" 
ON reports FOR SELECT 
USING (true);

-- Create policy to allow anyone to insert reports (public write)
CREATE POLICY "Allow public insert access" 
ON reports FOR INSERT 
WITH CHECK (true);

-- Note: We don't allow UPDATE or DELETE to prevent data tampering

