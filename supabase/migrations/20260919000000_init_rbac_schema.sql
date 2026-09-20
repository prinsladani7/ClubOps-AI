-- =============================================================================
-- ClubOps AI — Database Schema & RBAC Access Control Migration
-- Specification Version: 1.0 (September 2026)
-- Target Platform: PostgreSQL 15+ / Supabase
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum Types
CREATE TYPE user_role_enum AS ENUM ('admin', 'organizer', 'volunteer', 'member');
CREATE TYPE account_status_enum AS ENUM ('active', 'pending_verification', 'suspended', 'deactivated', 'locked_temporarily');
CREATE TYPE project_status_enum AS ENUM ('active', 'completed', 'archived', 'suspended');
CREATE TYPE task_status_enum AS ENUM ('pending', 'accepted', 'in_progress', 'blocked', 'submitted', 'completed');
CREATE TYPE task_priority_enum AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE dependency_type_enum AS ENUM ('blocks', 'relates_to');
CREATE TYPE invitation_status_enum AS ENUM ('pending', 'accepted', 'expired', 'revoked');
CREATE TYPE volunteer_availability_enum AS ENUM ('available', 'busy', 'overloaded', 'unavailable');

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'volunteer',
    status account_status_enum NOT NULL DEFAULT 'pending_verification',
    avatar_url TEXT,
    bio TEXT,
    phone VARCHAR(50),
    verification_token VARCHAR(255),
    verified_at TIMESTAMPTZ,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ROLES TABLE (Master RBAC Definitions)
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY, -- 'admin', 'organizer', 'volunteer', 'member'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. USER_ROLES TABLE (Mapping users to roles with optional scopes)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id VARCHAR(50) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    scope_type VARCHAR(50) DEFAULT 'organization', -- 'organization', 'project', 'team'
    scope_id UUID,
    granted_by UUID REFERENCES users(id),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_role_scope UNIQUE (user_id, role_id, scope_type, scope_id)
);

-- 4. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status project_status_enum NOT NULL DEFAULT 'active',
    budget NUMERIC(12, 2) DEFAULT 0.00,
    start_date DATE,
    end_date DATE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PROJECT_MEMBERS TABLE (Authorized roster per project scope)
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'volunteer', -- 'organizer' or 'volunteer'
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'deactivated', 'suspended'
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_project_user UNIQUE (project_id, user_id)
);

-- 6. TASKS TABLE (Workflow: pending -> accepted -> in_progress -> blocked -> submitted -> completed)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES users(id),
    status task_status_enum NOT NULL DEFAULT 'pending',
    priority task_priority_enum NOT NULL DEFAULT 'medium',
    due_at TIMESTAMPTZ NOT NULL,
    estimated_hours NUMERIC(6, 2) DEFAULT 0.00,
    actual_hours NUMERIC(6, 2) DEFAULT 0.00,
    checklist_json JSONB DEFAULT '[]'::jsonb,
    is_overdue BOOLEAN GENERATED ALWAYS AS (
        status NOT IN ('completed') AND due_at < NOW()
    ) STORED,
    blocked_at TIMESTAMPTZ,
    escalation_level VARCHAR(50), -- 'volunteer', 'organizer', 'admin'
    escalated_to UUID REFERENCES users(id),
    escalated_at TIMESTAMPTZ,
    resolution_status VARCHAR(50),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TASK_DEPENDENCIES TABLE
CREATE TABLE IF NOT EXISTS task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type dependency_type_enum NOT NULL DEFAULT 'blocks',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_no_self_dependency CHECK (task_id <> depends_on_task_id),
    CONSTRAINT uq_task_dependency UNIQUE (task_id, depends_on_task_id)
);

-- 8. TASK_COMMENTS TABLE
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TASK_EVIDENCE TABLE (Verification & Deliverables)
CREATE TABLE IF NOT EXISTS task_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES users(id),
    evidence_url TEXT NOT NULL,
    notes TEXT,
    approved BOOLEAN DEFAULT NULL, -- NULL=pending review, true=approved, false=rejected
    approved_by UUID REFERENCES users(id),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'task', 'risk', 'meeting', 'announcement', 'ai_approval', 'permission_request', 'escalation'
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'volunteer',
    token VARCHAR(255) UNIQUE NOT NULL,
    status invitation_status_enum NOT NULL DEFAULT 'pending',
    created_by UUID NOT NULL REFERENCES users(id),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. PROGRESS_REPORTS TABLE
CREATE TABLE IF NOT EXISTS progress_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    completed_tasks INT NOT NULL DEFAULT 0,
    pending_tasks INT NOT NULL DEFAULT 0,
    blocked_tasks INT NOT NULL DEFAULT 0,
    risks_identified JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. AUDIT_LOGS TABLE (Append-Only Immutable Event Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_type VARCHAR(20) NOT NULL DEFAULT 'user', -- 'user', 'ai', 'system'
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. SESSIONS & REFRESH_TOKENS TABLE
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. SKILLS TABLE
CREATE TABLE IF NOT EXISTS skills (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'general'
);

-- 16. USER_SKILLS TABLE
CREATE TABLE IF NOT EXISTS user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id VARCHAR(100) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency VARCHAR(20) NOT NULL DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'expert'
    CONSTRAINT uq_user_skill UNIQUE (user_id, skill_id)
);

-- 17. AVAILABILITY TABLE
CREATE TABLE IF NOT EXISTS availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status volunteer_availability_enum NOT NULL DEFAULT 'available',
    CONSTRAINT uq_user_availability_slot UNIQUE (user_id, day_of_week, start_time, end_time)
);

-- 18. ATTENDANCE & TIME_ENTRIES TABLE
CREATE TABLE IF NOT EXISTS attendance_time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hours_spent NUMERIC(5, 2) NOT NULL CHECK (hours_spent > 0),
    entry_date DATE NOT NULL,
    notes TEXT,
    approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_projects_organizer ON projects(organizer_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_owner ON tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON tasks(due_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Admins: full access policy
CREATE POLICY admin_all_users ON users FOR ALL USING (auth.jwt()->>'role' = 'admin');
CREATE POLICY admin_all_projects ON projects FOR ALL USING (auth.jwt()->>'role' = 'admin');
CREATE POLICY admin_all_tasks ON tasks FOR ALL USING (auth.jwt()->>'role' = 'admin');
CREATE POLICY admin_all_audit ON audit_logs FOR SELECT USING (auth.jwt()->>'role' = 'admin');

-- Organizers: scoped access to assigned projects and tasks within assigned projects
CREATE POLICY organizer_assigned_projects ON projects FOR ALL USING (
    organizer_id = auth.uid() OR
    id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role = 'organizer')
);

CREATE POLICY organizer_scoped_tasks ON tasks FOR ALL USING (
    project_id IN (
        SELECT id FROM projects WHERE organizer_id = auth.uid()
        UNION
        SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role = 'organizer'
    )
);

-- Volunteers: read projects they are in, view/update only assigned tasks
CREATE POLICY volunteer_projects_view ON projects FOR SELECT USING (
    id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND status = 'active')
);

CREATE POLICY volunteer_assigned_tasks ON tasks FOR SELECT USING (
    owner_id = auth.uid() OR
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
);

CREATE POLICY volunteer_update_own_task ON tasks FOR UPDATE USING (
    owner_id = auth.uid()
);

-- Audit log: immutable append-only, no update or delete allowed
CREATE POLICY audit_logs_insert_policy ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY audit_logs_read_admin ON audit_logs FOR SELECT USING (auth.jwt()->>'role' = 'admin');
