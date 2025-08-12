| table_name               | column_name     | data_type                |
| ------------------------ | --------------- | ------------------------ |
| organization_memberships | id              | uuid                     |
| organization_memberships | organization_id | uuid                     |
| organization_memberships | user_id         | uuid                     |
| organization_memberships | role            | character varying(50)    |
| organization_memberships | status          | character varying(20)    |
| organization_memberships | joined_at       | timestamp with time zone |
| organization_memberships | created_at      | timestamp with time zone |
| organization_memberships | updated_at      | timestamp with time zone |
| organizations            | id              | uuid                     |
| organizations            | name            | character varying(255)   |
| organizations            | slug            | character varying(100)   |
| organizations            | description     | text                     |
| organizations            | created_at      | timestamp with time zone |
| organizations            | updated_at      | timestamp with time zone |
| project_memberships      | id              | uuid                     |
| project_memberships      | project_id      | uuid                     |
| project_memberships      | user_id         | uuid                     |
| project_memberships      | role            | character varying(50)    |
| project_memberships      | invited_by      | uuid                     |
| project_memberships      | invited_at      | timestamp with time zone |
| project_memberships      | joined_at       | timestamp with time zone |
| project_memberships      | created_at      | timestamp with time zone |
| project_memberships      | updated_at      | timestamp with time zone |
| projects                 | id              | uuid                     |
| projects                 | organization_id | uuid                     |
| projects                 | workspace_id    | uuid                     |
| projects                 | name            | character varying(255)   |
| projects                 | slug            | character varying(255)   |
| projects                 | description     | text                     |
| projects                 | created_by      | uuid                     |
| projects                 | created_at      | timestamp with time zone |
| projects                 | updated_at      | timestamp with time zone |
| tasks                    | id              | uuid                     |
| tasks                    | organization_id | uuid                     |
| tasks                    | workspace_id    | uuid                     |
| tasks                    | project_id      | uuid                     |
| tasks                    | summary         | character varying(500)   |
| tasks                    | description     | text                     |
| tasks                    | assignee        | uuid                     |
| tasks                    | due_date        | date                     |
| tasks                    | created_by      | uuid                     |
| tasks                    | created_at      | timestamp with time zone |
| tasks                    | updated_at      | timestamp with time zone |
| user_profiles            | id              | uuid                     |
| user_profiles            | email           | character varying(255)   |
| user_profiles            | full_name       | character varying(255)   |
| user_profiles            | avatar_url      | text                     |
| user_profiles            | created_at      | timestamp with time zone |
| user_profiles            | updated_at      | timestamp with time zone |
| workspace_memberships    | id              | uuid                     |
| workspace_memberships    | workspace_id    | uuid                     |
| workspace_memberships    | user_id         | uuid                     |
| workspace_memberships    | role            | character varying(50)    |
| workspace_memberships    | invited_by      | uuid                     |
| workspace_memberships    | invited_at      | timestamp with time zone |
| workspace_memberships    | joined_at       | timestamp with time zone |
| workspace_memberships    | created_at      | timestamp with time zone |
| workspace_memberships    | updated_at      | timestamp with time zone |
| workspaces               | id              | uuid                     |
| workspaces               | organization_id | uuid                     |
| workspaces               | name            | character varying(255)   |
| workspaces               | slug            | character varying(100)   |
| workspaces               | description     | text                     |
| workspaces               | created_by      | uuid                     |
| workspaces               | created_at      | timestamp with time zone |
| workspaces               | updated_at      | timestamp with time zone |