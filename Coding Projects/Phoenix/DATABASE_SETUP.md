# Database Setup for Workspaces Feature

This guide explains how to set up the necessary database tables for the workspaces functionality in Phoenix.

## 🚨 URGENT: Fix Current Role Issues

**If you're seeing "Owner" instead of "Super Admin" roles, or missing workspace memberships, run this fix immediately:**

### Step 1: Run the Fix Script
Copy and paste the entire contents of `database/fix_current_user_setup.sql` into your Supabase SQL Editor and execute it.

This script will:
- ✅ **Fix "owner" roles** → Change to "super_admin" 
- ✅ **Create missing workspace memberships** for existing users
- ✅ **Create default workspaces** for organizations that don't have any
- ✅ **Update the signup function** to ensure correct roles going forward
- ✅ **Show verification results** so you can see what was fixed

### Step 2: Refresh Your App
After running the fix script:
1. **Refresh your browser** or restart your app
2. **Check your role** - should now show "Super Admin" instead of "Owner"
3. **Check workspaces** - you should see your default workspace and be able to access `/dashboard/workspaces`

---

## Prerequisites

- You should already have the following tables from the organization setup:
  - `organizations` table
  - `organization_memberships` table
  - Supabase auth is configured

## Step 1: Run the Workspace Schema

**If this is your first time setting up workspaces:**
Execute the SQL file `database/workspaces_schema.sql` in your Supabase SQL editor.

**If you're getting "already exists" errors:**
Use the clean setup script `database/clean_workspace_setup.sql` instead - it's safe to run multiple times.

```bash
# First time setup
# Copy database/workspaces_schema.sql into Supabase SQL Editor

# OR if getting "already exists" errors
# Copy database/clean_workspace_setup.sql into Supabase SQL Editor
```

The clean setup script will:
- ✅ Safely drop existing objects first
- ✅ Recreate everything cleanly
- ✅ Handle existing constraints and indexes
- ✅ Show verification messages

## Step 2: Verify Tables Created

After running the SQL, you should have these new tables:

### `workspaces`
- `id` (UUID, Primary Key)
- `name` (VARCHAR, NOT NULL)
- `slug` (VARCHAR, NOT NULL, Unique per organization)
- `description` (TEXT, Optional)
- `organization_id` (UUID, Foreign Key to organizations)
- `created_at` / `updated_at` (Timestamps)

### `workspace_memberships`
- `id` (UUID, Primary Key)
- `workspace_id` (UUID, Foreign Key to workspaces)
- `user_id` (UUID, Foreign Key to auth.users)
- `role` (VARCHAR: 'workspace_admin' or 'workspace_member')
- `invited_by` (UUID, Optional)
- `invited_at` / `joined_at` / `created_at` / `updated_at` (Timestamps)

## Step 3: Understanding the Role System

### **Organization Roles** (ONLY these 3 are valid):
- **`super_admin`** - Full organization control, can manage everything
- **`admin`** - Can manage workspaces, users, projects, and CRM
- **`member`** - Basic access to projects and CRM

### **Workspace Roles** (ONLY these 2 are valid):
- **`workspace_admin`** - Full workspace control, can manage members and projects
- **`workspace_member`** - Can create projects and access CRM within workspace

### **Correct User Creation Flow:**
1. **User Signs Up** → Creates organization
2. **Organization Membership** → User gets `super_admin` role
3. **Default Workspace** → Created automatically  
4. **Workspace Membership** → User gets `workspace_admin` role

## Step 4: Understanding the Permissions

The workspace system implements these role-based permissions:

### **Workspace Admin** (`workspace_admin`)
- Manage workspace members and their roles
- Create, edit, and delete projects within the workspace  
- Manage workspace settings
- View workspace analytics
- Full CRM access within the workspace

### **Workspace Member** (`workspace_member`)  
- Create projects within the workspace
- Manage contacts and companies
- View CRM data
- Basic collaboration features

### **Organization-Level Override**
- **Super Admins** and **Admins** at the organization level can:
  - Create and delete workspaces
  - Override workspace permissions
  - Manage workspace memberships

## Step 5: Row Level Security (RLS)

The schema automatically sets up RLS policies that ensure:

- ✅ Users can only see workspaces they're members of
- ✅ Only authorized users can create workspaces
- ✅ Workspace admins can manage their workspaces
- ✅ Organization admins have override permissions
- ✅ Users can only manage memberships they have permission for

## Troubleshooting

### Common Issues:

1. **"Owner" role instead of "Super Admin"**
   - **FIX**: Run `database/fix_current_user_setup.sql`
   - This changes "owner" → "super_admin"

2. **Missing workspace membership**
   - **FIX**: Run `database/fix_current_user_setup.sql`
   - This creates missing workspace memberships

3. **Workspace creation fails**
   - Check that the user has 'super_admin' or 'admin' role in organization_memberships
   - Verify organization_id exists and is correct
   - Check for unique constraint violations (name/slug already exists)

4. **"relation 'organizations' does not exist"**
   - Make sure you have the organizations table set up first
   - Check that organization_memberships table exists

### Checking Your Setup:

```sql
-- Verify your organization membership
SELECT om.role, o.name as organization_name 
FROM organization_memberships om
JOIN organizations o ON om.organization_id = o.id
WHERE om.user_id = auth.uid();

-- Check existing workspaces
SELECT w.*, wm.role as your_role
FROM workspaces w
JOIN workspace_memberships wm ON w.id = wm.workspace_id
WHERE wm.user_id = auth.uid();

-- Check for any remaining issues
SELECT 
  u.email,
  om.role as org_role,
  wm.role as workspace_role,
  o.name as organization,
  w.name as workspace
FROM auth.users u
LEFT JOIN organization_memberships om ON u.id = om.user_id
LEFT JOIN organizations o ON om.organization_id = o.id
LEFT JOIN workspace_memberships wm ON u.id = wm.user_id
LEFT JOIN workspaces w ON wm.workspace_id = w.id
WHERE u.id = auth.uid();
```

## Testing the Complete Setup

### Test New User Signup:
1. Create a new test user via the signup form
2. **Expected Results:**
   - Organization role: `super_admin` (NOT "owner")
   - Workspace role: `workspace_admin`
   - Default workspace created automatically
   - User can access `/dashboard/workspaces`

### Test Existing User Fix:
1. Run the fix script: `database/fix_current_user_setup.sql`
2. **Expected Results:**
   - Your role changes from "Owner" to "Super Admin"
   - You get a workspace membership as "Workspace Admin"
   - You can access the workspaces page
   - No more role-related errors

## Next Steps

Once the database is set up and fixed:

1. ✅ Users can navigate to `/dashboard/workspaces`
2. ✅ Create new workspaces (if they have permissions)
3. ✅ View workspaces they're members of
4. ✅ See their role badges on each workspace card
5. ✅ Access role-appropriate features throughout the app

The workspace system integrates seamlessly with the existing organization roles and provides a hierarchical structure: **Organization** → **Workspaces** → **Projects** → **Tasks**.

## Verification Commands

After running the fix, verify everything is working:

```sql
-- 1. Check all users have valid roles
SELECT 
  'Valid Organization Roles' as check_type,
  COUNT(*) as count
FROM organization_memberships 
WHERE role IN ('super_admin', 'admin', 'member');

-- 2. Check all workspace memberships have valid roles  
SELECT 
  'Valid Workspace Roles' as check_type,
  COUNT(*) as count
FROM workspace_memberships 
WHERE role IN ('workspace_admin', 'workspace_member');

-- 3. Check no users are missing workspace memberships
SELECT 
  'Users Missing Workspace Membership' as check_type,
  COUNT(*) as count
FROM organization_memberships om
LEFT JOIN workspace_memberships wm ON om.user_id = wm.user_id
WHERE wm.id IS NULL;
```

All counts in the third query should be **0** - meaning no users are missing workspace memberships.

---

## 🎉 Success Criteria

After following this guide, you should have:

- ✅ **Correct organization roles**: `super_admin`, `admin`, `member` only
- ✅ **Correct workspace roles**: `workspace_admin`, `workspace_member` only  
- ✅ **Complete signup flow**: New users get both organization and workspace memberships
- ✅ **Fixed existing users**: All current users have proper roles and workspace access
- ✅ **Working UI**: Role badges show correct names, workspaces page accessible 