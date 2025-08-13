-- Phoenix Task Management - Add Estimation and Health Fields
-- Run this script in your Supabase SQL editor

-- 1. Add estimation and health columns to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS estimation VARCHAR(50) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS health VARCHAR(50) DEFAULT 'good';

-- 2. Update projects table to include estimation and health in task_config
UPDATE projects 
SET task_config = jsonb_set(
  jsonb_set(
    COALESCE(task_config, '{}'::jsonb),
    '{estimations}',
    '[
      {"id": "xs", "name": "XS (1-2h)", "color": "#34C759", "order": 0},
      {"id": "small", "name": "Small (3-5h)", "color": "#8E8E93", "order": 1},
      {"id": "medium", "name": "Medium (1d)", "color": "#FF9500", "order": 2},
      {"id": "large", "name": "Large (2-3d)", "color": "#FF3B30", "order": 3},
      {"id": "xl", "name": "XL (1w+)", "color": "#AF52DE", "order": 4}
    ]'::jsonb
  ),
  '{healths}',
  '[
    {"id": "excellent", "name": "Excellent", "color": "#34C759", "order": 0},
    {"id": "good", "name": "Good", "color": "#8E8E93", "order": 1},
    {"id": "at_risk", "name": "At Risk", "color": "#FF9500", "order": 2},
    {"id": "blocked", "name": "Blocked", "color": "#FF3B30", "order": 3}
  ]'::jsonb
)
WHERE task_config IS NOT NULL;

-- 3. Add default estimation and health config for projects without task_config
UPDATE projects 
SET task_config = '{
  "statuses": [
    {"id": "todo", "name": "To Do", "color": "#8E8E93", "order": 0},
    {"id": "in_progress", "name": "In Progress", "color": "#FF9500", "order": 1},
    {"id": "completed", "name": "Completed", "color": "#34C759", "order": 2}
  ],
  "priorities": [
    {"id": "low", "name": "Low", "color": "#8E8E93", "order": 0},
    {"id": "medium", "name": "Medium", "color": "#FF9500", "order": 1},
    {"id": "high", "name": "High", "color": "#FF3B30", "order": 2}
  ],
  "estimations": [
    {"id": "xs", "name": "XS (1-2h)", "color": "#34C759", "order": 0},
    {"id": "small", "name": "Small (3-5h)", "color": "#8E8E93", "order": 1},
    {"id": "medium", "name": "Medium (1d)", "color": "#FF9500", "order": 2},
    {"id": "large", "name": "Large (2-3d)", "color": "#FF3B30", "order": 3},
    {"id": "xl", "name": "XL (1w+)", "color": "#AF52DE", "order": 4}
  ],
  "healths": [
    {"id": "excellent", "name": "Excellent", "color": "#34C759", "order": 0},
    {"id": "good", "name": "Good", "color": "#8E8E93", "order": 1},
    {"id": "at_risk", "name": "At Risk", "color": "#FF9500", "order": 2},
    {"id": "blocked", "name": "Blocked", "color": "#FF3B30", "order": 3}
  ],
  "defaultSection": "todo"
}'::jsonb
WHERE task_config IS NULL;

-- 4. Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_tasks_estimation ON tasks(estimation);
CREATE INDEX IF NOT EXISTS idx_tasks_health ON tasks(health);

-- 5. Update the get_project_tasks_with_details function to include new fields
DROP FUNCTION IF EXISTS get_project_tasks_with_details(UUID);
CREATE OR REPLACE FUNCTION get_project_tasks_with_details(p_project_id UUID)
RETURNS TABLE (
  id UUID,
  summary VARCHAR,
  description TEXT,
  status VARCHAR,
  priority VARCHAR,
  estimation VARCHAR,
  health VARCHAR,
  due_date DATE,
  assignee UUID,
  section_id UUID,
  sort_order INTEGER,
  tags TEXT[],
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  project_id UUID,
  workspace_id UUID,
  organization_id UUID,
  assignee_user JSONB,
  created_by_user JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.summary,
    t.description,
    t.status,
    t.priority,
    t.estimation,
    t.health,
    t.due_date,
    t.assignee,
    t.section_id,
    t.sort_order,
    t.tags,
    t.completed_at,
    t.created_at,
    t.updated_at,
    t.created_by,
    t.project_id,
    t.workspace_id,
    t.organization_id,
    CASE 
      WHEN t.assignee IS NOT NULL THEN
        jsonb_build_object(
          'id', au.id,
          'full_name', COALESCE(au.full_name, au.email),
          'email', au.email,
          'avatar_url', au.avatar_url
        )
      ELSE NULL
    END as assignee_user,
    CASE 
      WHEN t.created_by IS NOT NULL THEN
        jsonb_build_object(
          'id', cu.id,
          'full_name', COALESCE(cu.full_name, cu.email),
          'email', cu.email,
          'avatar_url', cu.avatar_url
        )
      ELSE NULL
    END as created_by_user
  FROM tasks t
  LEFT JOIN user_profiles au ON t.assignee = au.id
  LEFT JOIN user_profiles cu ON t.created_by = cu.id
  WHERE t.project_id = p_project_id
  ORDER BY t.section_id, t.sort_order, t.created_at;
END;
$$;

-- 6. Update the default config helper function
DROP FUNCTION IF EXISTS get_project_task_config(UUID);
CREATE OR REPLACE FUNCTION get_project_task_config(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  config JSONB;
BEGIN
  SELECT task_config INTO config
  FROM projects
  WHERE id = p_project_id;
  
  IF config IS NULL THEN
    RETURN '{
      "statuses": [
        {"id": "todo", "name": "To Do", "color": "#8E8E93", "order": 0},
        {"id": "in_progress", "name": "In Progress", "color": "#FF9500", "order": 1},
        {"id": "completed", "name": "Completed", "color": "#34C759", "order": 2}
      ],
      "priorities": [
        {"id": "low", "name": "Low", "color": "#8E8E93", "order": 0},
        {"id": "medium", "name": "Medium", "color": "#FF9500", "order": 1},
        {"id": "high", "name": "High", "color": "#FF3B30", "order": 2}
      ],
      "estimations": [
        {"id": "xs", "name": "XS (1-2h)", "color": "#34C759", "order": 0},
        {"id": "small", "name": "Small (3-5h)", "color": "#8E8E93", "order": 1},
        {"id": "medium", "name": "Medium (1d)", "color": "#FF9500", "order": 2},
        {"id": "large", "name": "Large (2-3d)", "color": "#FF3B30", "order": 3},
        {"id": "xl", "name": "XL (1w+)", "color": "#AF52DE", "order": 4}
      ],
      "healths": [
        {"id": "excellent", "name": "Excellent", "color": "#34C759", "order": 0},
        {"id": "good", "name": "Good", "color": "#8E8E93", "order": 1},
        {"id": "at_risk", "name": "At Risk", "color": "#FF9500", "order": 2},
        {"id": "blocked", "name": "Blocked", "color": "#FF3B30", "order": 3}
      ],
      "defaultSection": "todo"
    }'::JSONB;
  END IF;
  
  RETURN config;
END;
$$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Estimation and Health fields added successfully!';
  RAISE NOTICE 'New fields: estimation (xs/small/medium/large/xl) and health (excellent/good/at_risk/blocked)';
  RAISE NOTICE 'Both fields are fully customizable like priorities and statuses.';
END $$;
