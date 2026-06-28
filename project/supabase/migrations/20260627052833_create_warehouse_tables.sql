/*
# Create Warehouse Picker Control System tables

1. New Tables
- `detections` - Stores object detection results from camera feed
  - `id` (uuid, primary key)
  - `object_name` (text, not null) - detected object name
  - `confidence` (decimal, not null) - detection confidence score 0-1
  - `position_x` (decimal) - x coordinate in camera frame
  - `position_y` (decimal) - y coordinate in camera frame
  - `timestamp` (timestamptz, default now)
  - `created_at` (timestamptz, default now)

- `tasks` - Stores pick-and-place tasks
  - `id` (uuid, primary key)
  - `object_name` (text, not null) - target object to pick
  - `status` (text, default 'pending') - pending, in_progress, completed, failed
  - `priority` (text, default 'normal') - low, normal, high, critical
  - `created_at` (timestamptz, default now)
  - `completed_at` (timestamptz, nullable)
  - `notes` (text, nullable)

- `logs` - Stores system activity logs
  - `id` (uuid, primary key)
  - `action` (text, not null) - log action/event description
  - `category` (text, default 'system') - system, detection, robot, error
  - `details` (jsonb, nullable) - structured log details
  - `timestamp` (timestamptz, default now)
  - `created_at` (timestamptz, default now)

2. Security
- Enable RLS on all tables.
- Allow anon + authenticated CRUD for single-tenant warehouse system.
*/

CREATE TABLE IF NOT EXISTS detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_name text NOT NULL,
  confidence decimal NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  position_x decimal,
  position_y decimal,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  notes text
);

CREATE TABLE IF NOT EXISTS logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  category text NOT NULL DEFAULT 'system' CHECK (category IN ('system', 'detection', 'robot', 'error')),
  details jsonb,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_detections" ON detections;
CREATE POLICY "anon_select_detections" ON detections FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_detections" ON detections;
CREATE POLICY "anon_insert_detections" ON detections FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_detections" ON detections;
CREATE POLICY "anon_update_detections" ON detections FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_detections" ON detections;
CREATE POLICY "anon_delete_detections" ON detections FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
CREATE POLICY "anon_select_tasks" ON tasks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
CREATE POLICY "anon_insert_tasks" ON tasks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
CREATE POLICY "anon_update_tasks" ON tasks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;
CREATE POLICY "anon_delete_tasks" ON tasks FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_logs" ON logs;
CREATE POLICY "anon_select_logs" ON logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_logs" ON logs;
CREATE POLICY "anon_insert_logs" ON logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_logs" ON logs;
CREATE POLICY "anon_update_logs" ON logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_logs" ON logs;
CREATE POLICY "anon_delete_logs" ON logs FOR DELETE
  TO anon, authenticated USING (true);
