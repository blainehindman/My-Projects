[
  {
    "schemaname": "public",
    "tablename": "organization_memberships",
    "policyname": "Allow users to create their own memberships",
    "permissive": "PERMISSIVE",
    "cmd": "INSERT",
    "roles": "{public}",
    "using_expr": null,
    "with_check_expr": "((auth.uid() IS NOT NULL) AND (user_id = auth.uid()))"
  },
  {
    "schemaname": "public",
    "tablename": "organization_memberships",
    "policyname": "Allow users to view all memberships",
    "permissive": "PERMISSIVE",
    "cmd": "SELECT",
    "roles": "{public}",
    "using_expr": "true",
    "with_check_expr": null
  },
  {
    "schemaname": "public",
    "tablename": "organizations",
    "policyname": "Allow authenticated users to create organizations",
    "permissive": "PERMISSIVE",
    "cmd": "INSERT",
    "roles": "{public}",
    "using_expr": null,
    "with_check_expr": "(auth.uid() IS NOT NULL)"
  },
  {
    "schemaname": "public",
    "tablename": "organizations",
    "policyname": "Allow authenticated users to update organizations",
    "permissive": "PERMISSIVE",
    "cmd": "UPDATE",
    "roles": "{public}",
    "using_expr": "(auth.uid() IS NOT NULL)",
    "with_check_expr": null
  },
  {
    "schemaname": "public",
    "tablename": "organizations",
    "policyname": "Allow users to view all organizations",
    "permissive": "PERMISSIVE",
    "cmd": "SELECT",
    "roles": "{public}",
    "using_expr": "true",
    "with_check_expr": null
  },
  {
    "schemaname": "public",
    "tablename": "project_memberships",
    "policyname": "Users can create project memberships they can manage",
    "permissive": "PERMISSIVE",
    "cmd": "INSERT",
    "roles": "{public}",
    "using_expr": null,
    "with_check_expr": "((EXISTS ( SELECT 1\n   FROM (projects p\n     JOIN workspace_memberships wm ON ((wm.workspace_id = p.workspace_id)))\n  WHERE ((p.id = project_memberships.project_id) AND (wm.user_id = auth.uid()) AND ((wm.role)::text = 'workspace_admin'::text)))) OR (EXISTS ( SELECT 1\n   FROM (projects p\n     JOIN organization_memberships om ON ((om.organization_id = p.organization_id)))\n  WHERE ((p.id = project_memberships.project_id) AND (om.user_id = auth.uid()) AND ((om.role)::text = ANY (ARRAY[('super_admin'::character varying)::text, ('admin'::character varying)::text]))))) OR ((user_id = auth.uid()) AND ((role)::text = 'project_admin'::text)))"
  },
  {
    "schemaname": "public",
    "tablename": "project_memberships",
    "policyname": "Users can delete project memberships they can manage",
    "permissive": "PERMISSIVE",
    "cmd": "DELETE",
    "roles": "{public}",
    "using_expr": "((EXISTS ( SELECT 1\n   FROM (projects p\n     JOIN workspace_memberships wm ON ((wm.workspace_id = p.workspace_id)))\n  WHERE ((p.id = project_memberships.project_id) AND (wm.user_id = auth.uid()) AND ((wm.role)::text = 'workspace_admin'::text)))) OR (EXISTS ( SELECT 1\n   FROM (projects p\n     JOIN organization_memberships om ON ((om.organization_id = p.organization_id)))\n  WHERE ((p.id = project_memberships.project_id) AND (om.user_id = auth.uid()) AND ((om.role)::text = ANY (ARRAY[('super_admin'::character varying)::text, ('admin'::character varying)::text]))))) OR (user_id = auth.uid()))",
    "with_check_expr": null
  },
  {
    "schemaname": "public",
    "tablename": "project_memberships",
    "policyname": "Users can update project memberships they can manage",
    "permissive": "PERMISSIVE",
    "cmd": "UPDATE",
    "roles": "{public}",
    "using_expr": "((EXISTS ( SELECT 1\n   FROM (projects p\n     JOIN workspace_memberships wm ON ((wm.workspace_id = p.workspace_id)))\n  WHERE ((p.id = project_memberships.project_id) AND (wm.user_id = auth.uid()) AND ((wm.role)::text = 'workspace_admin'::text)))) OR (EXISTS ( SELECT 1\n   FROM (projects p\n     JOIN organization_memberships om ON ((om.organization_id = p.organization_id)))\n  WHERE ((p.id = project_memberships.project_id) AND (om.user_id = auth.uid()) AND ((om.role)::text = ANY (ARRAY[('super_admin'::character varying)::text, ('admin'::character varying)::text]))))))",
    "with_check_expr": null
  },
  {
    "schemaname": "public",
    "tablename": "project_memberships",
    "policyname": "Users can view relevant project memberships",
    "permissive": "PERMISSIVE",
    "cmd": "SELECT",
    "roles": "{public}",
    "using_expr": "((user_id = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM (projects p\n     JOIN workspace_memberships wm ON ((wm.workspace_id = p.workspace_id)))\n  WHERE ((p.id = project_memberships.project_id) AND (wm.user_id = auth.uid()) AND ((wm.role)::text = 'workspace_admin'::text)))) OR (EXISTS ( SELECT 1\n   FROM (projects p\n     JOIN organization_memberships om ON ((om.organization_id = p.organization_id)))\n  WHERE ((p.id = project_memberships.project_id) AND (om.user_id = auth.uid()) AND ((om.role)::text = ANY (ARRAY[('super_admin'::character varying)::text, ('admin'::character varying)::text]))))))",
    "with_check_expr": null
  },
  {
    "schemaname": "public",
    "tablename": "projects",
    "policyname": "Users can create projects in accessible workspaces",
    "permissive": "PERMISSIVE",
    "cmd": "INSERT",
    "roles": "{public}",
    "using_expr": null,
    "with_check_expr": "((EXISTS ( SELECT 1\n   FROM workspace_memberships wm\n  WHERE ((wm.workspace_id = projects.workspace_id) AND (wm.user_id = auth.uid())))) OR (EXISTS ( SELECT 1\n   FROM organization_memberships om\n  WHERE ((om.organization_id = projects.organization_id) AND (om.user_id = auth.uid()) AND ((om.role)::text = ANY (ARRAY[('super_admin'::character varying)::text, ('admin'::character varying)::text]))))))"
  },
  {
    "schemaname": "public",
    "tablename": "projects",
    "policyname": "Users can delete projects they can manage",
    "permissive": "PERMISSIVE",
    "cmd": "DELETE",
    "roles": "{public}",
    "using_expr": "((EXISTS ( SELECT 1\n   FROM workspace_memberships wm\n  WHERE ((wm.workspace_id = projects.workspace_id) AND (wm.user_id = auth.uid()) AND ((wm.role)::text = 'workspace_admin'::text)))) OR (EXISTS ( SELECT 1\n   FROM organization_memberships om\n  WHERE ((om.organization_id = projects.organization_id) AND (om.user_id = auth.uid()) AND ((om.role)::text = ANY (ARRAY[('super_admin'::character varying)::text, ('admin'::character varying)::text]))))))",
    "with_check_expr": null
  },
  {
    "schemaname": "public",
    "tablename": "projects",
    "policyname": "Users can update projects they can manage",
    "permissive": "PERMISSIVE",
    "cmd": "UPDATE",
    "roles": "{public}",
    "using_expr": "((EXISTS ( SELECT 1\n   FROM workspace_memberships wm\n  WHERE ((wm.workspace_id = projects.workspace_id) AND (wm.user_id = auth.uid()) AND ((wm.role)::text = 'workspace_admin'::text)))) OR (EXISTS ( SELECT 1\n   FROM organization_memberships om\n  WHERE ((om.organization_id = projects.organization_id) AND (om.user_id = auth.uid()) AND ((om.role)::text = ANY (ARRAY[('super_admin'::character varying)::text, ('admin'::character varying)::text]))))))",
    "with_check_expr": null
  },
  {
    "schemaname": "public",
    "tablename": "projects",
    "policyname": "Users can view projects in accessible workspaces",
    "permissive": "PERMISSIVE",
    "cmd": "SELECT",
    "roles": "{public}",
    "using_expr": "((EXISTS ( SELECT 1\n   FROM workspace_memberships wm\n  WHERE ((wm.workspace_id = projects.workspace_id) AND (wm.user_id = auth.uid())))) OR (EXISTS ( SELECT 1\n   FROM organization_memberships om\n  WHERE ((om.organization_id = projects.organization_id) AND (om.user_id = auth.uid()) AND ((om.role)::text = ANY (ARRAY[('super_admin'::character varying)::text, ('admin'::character varying)::text]))))))",
    "with_check_expr": null
  },
  {
    "schemaname": "public",
    "tablename": "tasks",
    "policyname": "Users can create tasks in accessible projects",
    "permissive": "PERMISSIVE",
    "cmd": "INSERT",
    "roles": "{public}",
    "using_expr": null,
    "with_check_expr": "((EXISTS ( SELECT 1\n   FROM project_memberships pm\n  WHERE ((pm.project_id = tasks.project_id) AND (pm.user_id = auth.uid())))) OR (EXISTS ( SELECT 1\n   FROM workspace_memberships wm\n  WHERE ((wm.workspace_id = tasks.workspace_id) AND (wm.user_id = auth.uid())))) OR (EXISTS ( SELECT 1\n   FROM organization_memberships om\n  WHERE ((om.organization_id = tasks.organization_id) AND (om.user_id = auth.uid()) AND ((om.role)::text = ANY (ARRAY[('super_admin'::character varying)::text, ('admin'::character varying)::text]))))))"
  },
  {
    "schemaname": "public",
    "tablename": "tasks",
    "policyname": "Users can delete tasks with proper permissions",
    "permissive": "PERMISSIVE",
    "cmd": "DELETE",
    "roles": "{public}",
    "using_expr": "((created_by = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM project_memberships pm\n  WHERE ((pm.project_id = tasks.project_id) AND (pm.user_id = auth.uid()) AND ((pm.role)::text = 'project_admin'::text)))) OR (EXISTS ( SELECT 1\n   FROM workspace_memberships wm\n  WHERE ((wm.workspace_id = tasks.workspace_id) AND (wm.user_id = auth.uid()) AND ((wm.role)::text = 'workspace_admin'::text)))) OR (EXISTS ( SELECT 1\n   FROM organization_memberships om\n  WHERE ((om.organization_id = tasks.organization_id) AND (om.user_id = auth.uid()) AND ((om.role)::text = ANY (ARRAY[('super_admin'::character varying)::text, ('admin'::character varying)::text]))))))",
    "with_check_expr": null
  },
  {
    "schemaname": "public",
    "tablename": "tasks",
    "policyname": "Users can update tasks with proper permissions",
    "permissive": "PERMISSIVE",
    "cmd": "UPDATE",
    "roles": "{public}",
    "using_expr": "((created_by = auth.uid()) OR (assignee = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM project_memberships pm\n  WHERE ((pm.project_id = tasks.project_id) AND (pm.user_id = auth.uid()) AND ((pm.role)::text = 'project_admin'::text)))) OR (EXISTS ( SELECT 1\n   FROM workspace_memberships wm\n  WHERE ((wm.workspace_id = tasks.workspace_id) AND (wm.user_id = auth.uid()) AND ((wm.role)::text = 'workspace_admin'::text)))) OR (EXISTS ( SELECT 1\n   FROM organization_memberships om\n  WHERE ((om.organization_id = tasks.organization_id) AND (om.user_id = auth.uid()) AND ((om.role)::text = ANY (ARRAY[('super_admin'::character varying)::text, ('admin'::character varying)::text]))))))",
    "with_check_expr": null
  },
  {
    "schemaname": "public",
    "tablename": "tasks",
    "policyname": "Users can view tasks in accessible projects",
    "permissive": "PERMISSIVE",
    "cmd": "SELECT",
    "roles": "{public}",
    "using_expr": "((EXISTS ( SELECT 1\n   FROM project_memberships pm\n  WHERE ((pm.project_id = tasks.project_id) AND (pm.user_id = auth.uid())))) OR (EXISTS ( SELECT 1\n   FROM workspace_memberships wm\n  WHERE ((wm.workspace_id = tasks.workspace_id) AND (wm.user_id = auth.uid())))) OR (EXISTS ( SELECT 1\n   FROM organization_memberships om\n  WHERE ((om.organization_id = tasks.organization_id) AND (om.user_id = auth.uid()) AND ((om.role)::text = ANY (ARRAY[('super_admin'::character varying)::text, ('admin'::character varying)::text]))))))",
    "with_check_expr": null
  },
  {
    "schemaname": "public",
    "tablename": "user_profiles",
    "policyname": "Users can insert own profile",
    "permissive": "PERMISSIVE",
    "cmd": "INSERT",
    "roles": "{public}",
    "using_expr": null,
    "with_check_expr": "(id = auth.uid())"
  },
  {
    "schemaname": "public",
    "tablename": "user_profiles",
    "policyname": "Users can update own profile",
    "permissive": "PERMISSIVE",
    "cmd": "UPDATE",
    "roles": "{public}",
    "using_expr": "(id = auth.uid())",
    "with_check_expr": null
  },
  {
    "schemaname": "public",
    "tablename": "user_profiles",
    "policyname": "Users can view profiles of related users",
    "permissive": "PERMISSIVE",
    "cmd": "SELECT",
    "roles": "{public}",
    "using_expr": "((id = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM (organization_memberships om1\n     JOIN organization_memberships om2 ON ((om1.organization_id = om2.organization_id)))\n  WHERE ((om1.user_id = auth.uid()) AND (om2.user_id = user_profiles.id)))))",
    "with_check_expr": null
  },
  {
    "schemaname": "public",
    "tablename": "workspace_memberships",
    "policyname": "Users can create workspace memberships",
    "permissive": "PERMISSIVE",
    "cmd": "INSERT",
    "roles": "{public}",
    "using_expr": null,
    "with_check_expr": "true"
  },
  {
    "schemaname": "public",
    "tablename": "workspace_memberships",
    "policyname": "Users can delete workspace memberships",
    "permissive": "PERMISSIVE",
    "cmd": "DELETE",
    "roles": "{public}",
    "using_expr": "(user_id = auth.uid())",
    "with_check_expr": null
  },
  {
    "schemaname": "public",
    "tablename": "workspace_memberships",
    "policyname": "Users can update workspace memberships",
    "permissive": "PERMISSIVE",
    "cmd": "UPDATE",
    "roles": "{public}",
    "using_expr": "(user_id = auth.uid())",
    "with_check_expr": null
  },
  {
    "schemaname": "public",
    "tablename": "workspace_memberships",
    "policyname": "Users can view their own workspace memberships",
    "permissive": "PERMISSIVE",
    "cmd": "SELECT",
    "roles": "{public}",
    "using_expr": "(user_id = auth.uid())",
    "with_check_expr": null
  },
  {
    "schemaname": "public",
    "tablename": "workspaces",
    "policyname": "Allow authenticated users to create workspaces",
    "permissive": "PERMISSIVE",
    "cmd": "INSERT",
    "roles": "{public}",
    "using_expr": null,
    "with_check_expr": "(auth.uid() IS NOT NULL)"
  },
  {
    "schemaname": "public",
    "tablename": "workspaces",
    "policyname": "Allow users to view all workspaces",
    "permissive": "PERMISSIVE",
    "cmd": "SELECT",
    "roles": "{public}",
    "using_expr": "true",
    "with_check_expr": null
  },
  {
    "schemaname": "public",
    "tablename": "workspaces",
    "policyname": "Organization admins can delete workspaces",
    "permissive": "PERMISSIVE",
    "cmd": "DELETE",
    "roles": "{public}",
    "using_expr": "(EXISTS ( SELECT 1\n   FROM organization_memberships\n  WHERE ((organization_memberships.organization_id = workspaces.organization_id) AND (organization_memberships.user_id = auth.uid()) AND ((organization_memberships.role)::text = ANY (ARRAY[('super_admin'::character varying)::text, ('admin'::character varying)::text])))))",
    "with_check_expr": null
  },
  {
    "schemaname": "public",
    "tablename": "workspaces",
    "policyname": "Users can create workspaces with proper permissions",
    "permissive": "PERMISSIVE",
    "cmd": "INSERT",
    "roles": "{public}",
    "using_expr": null,
    "with_check_expr": "(EXISTS ( SELECT 1\n   FROM organization_memberships\n  WHERE ((organization_memberships.organization_id = workspaces.organization_id) AND (organization_memberships.user_id = auth.uid()) AND ((organization_memberships.role)::text = ANY (ARRAY[('super_admin'::character varying)::text, ('admin'::character varying)::text])))))"
  },
  {
    "schemaname": "public",
    "tablename": "workspaces",
    "policyname": "Users can view workspaces they are members of",
    "permissive": "PERMISSIVE",
    "cmd": "SELECT",
    "roles": "{public}",
    "using_expr": "(EXISTS ( SELECT 1\n   FROM workspace_memberships\n  WHERE ((workspace_memberships.workspace_id = workspaces.id) AND (workspace_memberships.user_id = auth.uid()))))",
    "with_check_expr": null
  },
  {
    "schemaname": "public",
    "tablename": "workspaces",
    "policyname": "Workspace admins can update workspaces",
    "permissive": "PERMISSIVE",
    "cmd": "UPDATE",
    "roles": "{public}",
    "using_expr": "((EXISTS ( SELECT 1\n   FROM workspace_memberships\n  WHERE ((workspace_memberships.workspace_id = workspaces.id) AND (workspace_memberships.user_id = auth.uid()) AND ((workspace_memberships.role)::text = 'workspace_admin'::text)))) OR (EXISTS ( SELECT 1\n   FROM organization_memberships\n  WHERE ((organization_memberships.organization_id = workspaces.organization_id) AND (organization_memberships.user_id = auth.uid()) AND ((organization_memberships.role)::text = ANY (ARRAY[('super_admin'::character varying)::text, ('admin'::character varying)::text]))))))",
    "with_check_expr": null
  }
]