# Supabase SQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  image_url TEXT,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid errors on re-run
DROP POLICY IF EXISTS "Public read access for employees" ON employees;
DROP POLICY IF EXISTS "Admin full access for employees" ON employees;
DROP POLICY IF EXISTS "Public read access for feedback" ON feedback;
DROP POLICY IF EXISTS "Public create access for feedback" ON feedback;
DROP POLICY IF EXISTS "Admin delete access for feedback" ON feedback;

-- Policies for employees
CREATE POLICY "Public read access for employees" ON employees FOR SELECT USING (true);
CREATE POLICY "Admin full access for employees" ON employees FOR ALL USING (true);

-- Policies for feedback
CREATE POLICY "Public read access for feedback" ON feedback FOR SELECT USING (true);
CREATE POLICY "Public create access for feedback" ON feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin delete access for feedback" ON feedback FOR DELETE USING (true);
