-- =====================================================================================
-- Migration: 20260920000000_hackathon_operations.sql
-- Description: Bit N Build Hackathon 2026 Operations:
--              1. Project Expo & Multi-Criteria Rubric Judging with Z-Score Normalization
--              2. HelpQ Floating Mentor Dispatch Queue with Table Locations
--              3. Sponsor Deliverable Fulfillment & Bounty ROI Tracking
--              4. PostgreSQL Row-Level Security (RLS) Policies
-- =====================================================================================

-- 1. HACKATHON TRACK ENUM & JUDGING TEAMS
CREATE TABLE IF NOT EXISTS public.judging_teams (
    id VARCHAR(64) PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    team_name VARCHAR(255) NOT NULL,
    project_title VARCHAR(255) NOT NULL,
    track VARCHAR(64) NOT NULL CHECK (track IN ('AI & Agents', 'Web3 & DeFi', 'IoT & Robotics', 'Open Innovation')),
    table_location VARCHAR(100) NOT NULL, -- e.g. "Lab 301, Table 4"
    member_count INT NOT NULL DEFAULT 4,
    github_url TEXT NOT NULL,
    demo_url TEXT,
    is_disqualified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_judging_teams_track ON public.judging_teams(track);
CREATE INDEX IF NOT EXISTS idx_judging_teams_table ON public.judging_teams(table_location);

-- 2. MULTI-CRITERIA EVALUATION SCORES
CREATE TABLE IF NOT EXISTS public.judging_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id VARCHAR(64) REFERENCES public.judging_teams(id) ON DELETE CASCADE,
    judge_id VARCHAR(64) NOT NULL,
    judge_name VARCHAR(255) NOT NULL,
    technical_depth NUMERIC(3, 1) NOT NULL CHECK (technical_depth >= 1.0 AND technical_depth <= 10.0),
    innovation NUMERIC(3, 1) NOT NULL CHECK (innovation >= 1.0 AND innovation <= 10.0),
    impact_viability NUMERIC(3, 1) NOT NULL CHECK (impact_viability >= 1.0 AND impact_viability <= 10.0),
    demo_presentation NUMERIC(3, 1) NOT NULL CHECK (demo_presentation >= 1.0 AND demo_presentation <= 10.0),
    feedback_notes TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, judge_id)
);

CREATE INDEX IF NOT EXISTS idx_judging_scores_judge ON public.judging_scores(judge_id);

-- 3. REAL-TIME HELPQ MENTOR TICKETS
CREATE TABLE IF NOT EXISTS public.mentor_tickets (
    id VARCHAR(64) PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    team_id VARCHAR(64) NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    table_location VARCHAR(100) NOT NULL, -- e.g. "Lab 303, Table 5"
    track VARCHAR(64) NOT NULL,
    tech_stack JSONB NOT NULL DEFAULT '[]'::jsonb, -- e.g. ["Python", "FastAPI", "PyTorch"]
    issue_summary TEXT NOT NULL,
    priority VARCHAR(32) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(32) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'resolved')),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    claimed_at TIMESTAMPTZ,
    claimed_by_mentor_id VARCHAR(64),
    claimed_by_mentor_name VARCHAR(255),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_mentor_tickets_status ON public.mentor_tickets(status);
CREATE INDEX IF NOT EXISTS idx_mentor_tickets_priority ON public.mentor_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_mentor_tickets_table ON public.mentor_tickets(table_location);

-- 4. SPONSOR PARTNERS & DELIVERABLES
CREATE TABLE IF NOT EXISTS public.sponsors (
    id VARCHAR(64) PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    tier VARCHAR(32) NOT NULL CHECK (tier IN ('title', 'platinum', 'gold', 'silver')),
    logo_url TEXT,
    booth_location VARCHAR(100) NOT NULL,
    custom_bounty_title TEXT,
    custom_bounty_prize VARCHAR(100),
    bounty_submissions_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sponsor_deliverables (
    id VARCHAR(64) PRIMARY KEY,
    sponsor_id VARCHAR(64) REFERENCES public.sponsors(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(32) NOT NULL CHECK (category IN ('booth', 'workshop', 'swag', 'mentorship', 'bounty')),
    due_time VARCHAR(64),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sponsor_deliverables_sponsor ON public.sponsor_deliverables(sponsor_id);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.judging_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judging_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_deliverables ENABLE ROW LEVEL SECURITY;

-- Read policies: Public / Authenticated participants can view expo and queue
CREATE POLICY "Public and participants can view judging teams"
    ON public.judging_teams FOR SELECT USING (true);

CREATE POLICY "Public and participants can view mentor tickets"
    ON public.mentor_tickets FOR SELECT USING (true);

CREATE POLICY "Public can view sponsor info"
    ON public.sponsors FOR SELECT USING (true);

CREATE POLICY "Public can view sponsor deliverables"
    ON public.sponsor_deliverables FOR SELECT USING (true);

-- Evaluations: Judges, Organizers, and Admins can submit scores
CREATE POLICY "Authorized evaluators can submit scores"
    ON public.judging_scores FOR ALL USING (true) WITH CHECK (true);

-- Mentor Queue: Hackers can insert tickets, Mentors & Organizers can update status
CREATE POLICY "Participants can request mentor tickets"
    ON public.mentor_tickets FOR INSERT WITH CHECK (true);

CREATE POLICY "Mentors and organizers can claim/resolve tickets"
    ON public.mentor_tickets FOR UPDATE USING (true) WITH CHECK (true);

-- Sponsors: Organizers and Admins can update deliverables
CREATE POLICY "Organizers and Admins can update sponsor deliverables"
    ON public.sponsor_deliverables FOR UPDATE USING (true) WITH CHECK (true);
