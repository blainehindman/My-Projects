-- Phoenix Task Management System - Database Updates
-- Run this script in your Supabase SQL editor

-- 1. Enhanced projects table with JSON configuration
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS task_config JSONB DEFAULT '{
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
  "defaultSection": "todo"
}';

-- 2. Enhanced tasks table for better organization
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'todo',
ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS section_id UUID,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 3. Create task_sections table
CREATE TABLE IF NOT EXISTS task_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#007AFF',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 4. Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create task_attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Add foreign key constraint for section_id if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_section_id_fkey'
    ) THEN
        ALTER TABLE tasks 
        ADD CONSTRAINT tasks_section_id_fkey 
        FOREIGN KEY (section_id) REFERENCES task_sections(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_section_id ON tasks(section_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks(sort_order);
CREATE INDEX IF NOT EXISTS idx_task_sections_project_id ON task_sections(project_id);
CREATE INDEX IF NOT EXISTS idx_task_sections_sort_order ON task_sections(sort_order);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE task_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for task_sections
DROP POLICY IF EXISTS "Users can view task sections in their projects" ON task_sections;
CREATE POLICY "Users can view task sections in their projects" ON task_sections
  FOR SELECT USING (
    project_id IN (
      SELECT pm.project_id FROM project_memberships pm 
      WHERE pm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Project admins can manage task sections" ON task_sections;
CREATE POLICY "Project admins can manage task sections" ON task_sections
  FOR ALL USING (
    project_id IN (
      SELECT pm.project_id FROM project_memberships pm 
      WHERE pm.user_id = auth.uid() 
      AND pm.role IN ('admin', 'owner')
    )
  );

-- 10. RLS Policies for task_comments
DROP POLICY IF EXISTS "Users can view comments in their project tasks" ON task_comments;
CREATE POLICY "Users can view comments in their project tasks" ON task_comments
  FOR SELECT USING (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN project_memberships pm ON t.project_id = pm.project_id
      WHERE pm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can add comments to project tasks" ON task_comments;
CREATE POLICY "Users can add comments to project tasks" ON task_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN project_memberships pm ON t.project_id = pm.project_id
      WHERE pm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own comments" ON task_comments;
CREATE POLICY "Users can update their own comments" ON task_comments
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own comments" ON task_comments;
CREATE POLICY "Users can delete their own comments" ON task_comments
  FOR DELETE USING (user_id = auth.uid());

-- 11. RLS Policies for task_attachments
DROP POLICY IF EXISTS "Users can view attachments in their project tasks" ON task_attachments;
CREATE POLICY "Users can view attachments in their project tasks" ON task_attachments
  FOR SELECT USING (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN project_memberships pm ON t.project_id = pm.project_id
      WHERE pm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can add attachments to project tasks" ON task_attachments;
CREATE POLICY "Users can add attachments to project tasks" ON task_attachments
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN project_memberships pm ON t.project_id = pm.project_id
      WHERE pm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own attachments" ON task_attachments;
CREATE POLICY "Users can delete their own attachments" ON task_attachments
  FOR DELETE USING (uploaded_by = auth.uid());

-- 12. Helper function to get project task configuration
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
      "defaultSection": "todo"
    }'::JSONB;
  END IF;
  
  RETURN config;
END;
$$;

-- 13. Helper function to update project task configuration
DROP FUNCTION IF EXISTS update_project_task_config(UUID, JSONB);
CREATE OR REPLACE FUNCTION update_project_task_config(p_project_id UUID, p_config JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE projects
  SET task_config = p_config,
      updated_at = NOW()
  WHERE id = p_project_id;
  
  RETURN FOUND;
END;
$$;

-- 14. Enhanced function to get project tasks with details
DROP FUNCTION IF EXISTS get_project_tasks_with_details(UUID);
CREATE OR REPLACE FUNCTION get_project_tasks_with_details(p_project_id UUID)
RETURNS TABLE (
  id UUID,
  summary VARCHAR,
  description TEXT,
  status VARCHAR,
  priority VARCHAR,
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

-- 15. Create default sections for existing projects
INSERT INTO task_sections (project_id, name, color, sort_order, created_by)
SELECT 
  p.id,
  section_name,
  section_color,
  section_order,
  p.created_by
FROM projects p
CROSS JOIN (
  VALUES 
    ('To Do', '#8E8E93', 0),
    ('In Progress', '#FF9500', 1),
    ('Done', '#34C759', 2)
) AS default_sections(section_name, section_color, section_order)
WHERE NOT EXISTS (
  SELECT 1 FROM task_sections ts WHERE ts.project_id = p.id
);

-- 16. Update existing tasks to reference default sections
UPDATE tasks 
SET section_id = (
  SELECT ts.id 
  FROM task_sections ts 
  WHERE ts.project_id = tasks.project_id 
  AND ts.name = 'To Do'
  LIMIT 1
)
WHERE section_id IS NULL;

-- 17. Create trigger to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to relevant tables
DROP TRIGGER IF EXISTS update_task_sections_updated_at ON task_sections;
CREATE TRIGGER update_task_sections_updated_at 
  BEFORE UPDATE ON task_sections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_comments_updated_at ON task_comments;
CREATE TRIGGER update_task_comments_updated_at 
  BEFORE UPDATE ON task_comments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 18. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Phoenix Task Management database setup completed successfully!';
  RAISE NOTICE 'You can now use the task board with sections, comments, and attachments.';
END $$;
