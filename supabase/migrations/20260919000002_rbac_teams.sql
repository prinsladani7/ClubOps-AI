-- =====================================================================================
-- Migration: 20260919000002_rbac_teams.sql
-- Description: Production-Quality RBAC, Hierarchical Teams, Delegation, Scoped Permissions,
--              Temporary Event Roles, Permission Requests, Escalations, and RLS.
-- =====================================================================================

-- 1. ROLES & PERMISSIONS SCHEMA
CREATE TABLE IF NOT EXISTS public.roles (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    hierarchy_level INT NOT NULL DEFAULT 10, -- Admin: 1, Organizer: 2, Volunteer: 3, Member: 4
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id VARCHAR(64) PRIMARY KEY,
    action VARCHAR(64) NOT NULL UNIQUE,
    scope VARCHAR(32) NOT NULL, -- organization, team, event, task
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id VARCHAR(64) REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(64) REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 2. TEAMS & HIERARCHICAL MEMBERSHIP (Section 2, 5 & 13)
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organizer_id UUID REFERENCES public.users(id) ON DELETE RESTRICT,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (club_id, name)
);

CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL DEFAULT 'volunteer' CHECK (role IN ('organizer', 'volunteer', 'acting_organizer')),
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (team_id, user_id)
);

-- 3. TEMPORARY EVENT ROLES & ACTING ORGANIZERS (Section 8 & 9)
CREATE TABLE IF NOT EXISTS public.role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role VARCHAR(64) NOT NULL, -- e.g. 'REGISTRATION_LEAD', 'STAGE_LEAD', 'ACTING_ORGANIZER'
    scope_type VARCHAR(32) NOT NULL CHECK (scope_type IN ('organization', 'team', 'event', 'task')),
    scope_id VARCHAR(64) NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    granted_by UUID REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (expires_at > starts_at)
);

-- 4. TASK DELEGATIONS & ESCALATIONS (Section 7 & 11)
CREATE TABLE IF NOT EXISTS public.task_delegations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES public.users(id) ON DELETE RESTRICT,
    to_user_id UUID REFERENCES public.users(id) ON DELETE RESTRICT,
    delegated_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT
);

-- Add delegation & escalation tracking columns to tasks table if not existing
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS escalation_level VARCHAR(32) CHECK (escalation_level IN ('volunteer', 'organizer', 'admin')),
ADD COLUMN IF NOT EXISTS escalated_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resolution_status VARCHAR(32) DEFAULT 'pending' CHECK (resolution_status IN ('pending', 'investigating', 'resolved'));

-- 5. PERMISSION REQUESTS (Section 10)
CREATE TABLE IF NOT EXISTS public.permission_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    permission VARCHAR(64) NOT NULL,
    scope_type VARCHAR(32) NOT NULL CHECK (scope_type IN ('organization', 'team', 'event', 'task')),
    scope_id VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64),
    reason TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'temporarily_approved')),
    reviewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MEMBER STATUS HISTORY (Section 13)
CREATE TABLE IF NOT EXISTS public.member_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    old_status VARCHAR(32),
    new_status VARCHAR(32) NOT NULL,
    changed_by UUID REFERENCES public.users(id) ON DELETE RESTRICT,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. INDEXES FOR HIGH-EFFICIENCY LOOKUPS & RBAC RESOLUTION
CREATE INDEX IF NOT EXISTS idx_teams_club_id ON public.teams(club_id);
CREATE INDEX IF NOT EXISTS idx_teams_organizer_id ON public.teams(organizer_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_user_active ON public.role_assignments(user_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_permission_requests_status ON public.permission_requests(status);
CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON public.tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_escalation ON public.tasks(escalation_level, resolution_status);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES (Section 14)
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_requests ENABLE ROW LEVEL SECURITY;

-- Teams RLS
DROP POLICY IF EXISTS "Admins have full access to teams" ON public.teams;
CREATE POLICY "Admins have full access to teams"
ON public.teams FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid() AND u.role = 'admin' AND u.status != 'suspended'
    )
);

DROP POLICY IF EXISTS "Organizers can view and edit their own teams" ON public.teams;
CREATE POLICY "Organizers can view and edit their own teams"
ON public.teams FOR ALL
TO authenticated
USING (
    organizer_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.role_assignments ra 
        WHERE ra.user_id = auth.uid() 
          AND ra.role = 'ACTING_ORGANIZER' 
          AND ra.scope_id = teams.id::text 
          AND ra.status = 'active' 
          AND ra.expires_at > NOW()
    )
);

DROP POLICY IF EXISTS "Volunteers can view their assigned teams" ON public.teams;
CREATE POLICY "Volunteers can view their assigned teams"
ON public.teams FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.team_members tm 
        WHERE tm.team_id = teams.id AND tm.user_id = auth.uid() AND tm.status = 'active'
    )
);

-- Permission Requests RLS
DROP POLICY IF EXISTS "Requesters can view and submit their own requests" ON public.permission_requests;
CREATE POLICY "Requesters can view and submit their own requests"
ON public.permission_requests FOR ALL
TO authenticated
USING (requester_id = auth.uid());

DROP POLICY IF EXISTS "Admins and Organizers can review permission requests" ON public.permission_requests;
CREATE POLICY "Admins and Organizers can review permission requests"
ON public.permission_requests FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'organizer') AND u.status != 'suspended'
    )
);
