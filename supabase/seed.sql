-- ClubOps AI: Deterministic Seed Data
-- Aligns with Section 24 (Demo Data) and 13_DEMO_SCRIPT.md
-- Event: LJ TechFest 2026, Club: Syntax Squad, 24 Volunteers, 42 Tasks, Dependency Chains

-- Fixed UUIDs for deterministic reference
\set club_id '11111111-1111-1111-1111-111111111111'
\set admin_user_id 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
\set jay_user_id 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
\set priya_user_id 'cccccccc-cccc-cccc-cccc-cccccccccccc'
\set rahul_user_id 'dddddddd-dddd-dddd-dddd-dddddddddddd'
\set event_id '22222222-2222-2222-2222-222222222222'

-- Seed Admin and Core Users
INSERT INTO public.users (id, email, name, avatar_url, role) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'prins@syntaxsquad.edu', 'Prins Patel', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Prins', 'admin'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'jay.shah@syntaxsquad.edu', 'Jay Shah', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jay', 'organizer'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'priya.mehta@syntaxsquad.edu', 'Priya Mehta', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya', 'organizer'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'rahul.sharma@syntaxsquad.edu', 'Rahul Sharma', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul', 'volunteer')
ON CONFLICT (id) DO NOTHING;

-- Seed Club
INSERT INTO public.clubs (id, name, description, created_by) VALUES
('11111111-1111-1111-1111-111111111111', 'Syntax Squad / Tech Club', 'Premier college technology, coding and innovation society', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT (id) DO NOTHING;

-- Club Members
INSERT INTO public.club_members (club_id, user_id, role, status) VALUES
('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin', 'active'),
('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'organizer', 'active'),
('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'organizer', 'active'),
('11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'volunteer', 'active')
ON CONFLICT (club_id, user_id) DO NOTHING;

-- Seed Event: LJ TechFest 2026
INSERT INTO public.events (id, club_id, name, description, start_at, end_at, venue, status, budget, created_by) VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'LJ TechFest 2026', 'Annual flagship technical symposium hosting 500 participants across hackathons, robotics, AI workshops, and speaker panels.', '2026-10-24 09:00:00+00', '2026-10-26 18:00:00+00', 'Grand Auditorium & Engineering Hall B', 'active', 15000.00, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT (id) DO NOTHING;

-- Seed Dependency Chain Tasks
INSERT INTO public.tasks (id, event_id, title, description, owner_id, status, priority, due_at) VALUES
('33333333-3333-3333-3333-000000000001', '22222222-2222-2222-2222-222222222222', 'Confirm Grand Auditorium Venue Booking', 'Obtain signed administrative approval and key access for the main auditorium from Dean Office.', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'blocked', 'critical', NOW() - INTERVAL '2 days'),
('33333333-3333-3333-3333-000000000002', '22222222-2222-2222-2222-222222222222', 'Finalize Stage Rigging & Lighting Design', 'Coordinate with lighting technicians on stage spotlighting and projector layout.', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'todo', 'high', NOW() + INTERVAL '3 days'),
('33333333-3333-3333-3333-000000000003', '22222222-2222-2222-2222-222222222222', 'Sound Check & Wireless Mic Setup', 'Audio balance testing with speakers and live mixer configuration.', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'todo', 'high', NOW() + INTERVAL '5 days'),
('33333333-3333-3333-3333-000000000004', '22222222-2222-2222-2222-222222222222', 'Full Dress Rehearsal & Speaker Walkthrough', 'End-to-end run of opening ceremony with keynotes and student hosts.', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'backlog', 'medium', NOW() + INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- Seed Task Dependencies (1 -> 2 -> 3 -> 4)
INSERT INTO public.task_dependencies (task_id, depends_on_task_id, dependency_type) VALUES
('33333333-3333-3333-3333-000000000002', '33333333-3333-3333-3333-000000000001', 'blocks'),
('33333333-3333-3333-3333-000000000003', '33333333-3333-3333-3333-000000000002', 'blocks'),
('33333333-3333-3333-3333-000000000004', '33333333-3333-3333-3333-000000000003', 'blocks')
ON CONFLICT DO NOTHING;

-- Seed Critical Risk
INSERT INTO public.risks (id, event_id, title, description, severity, probability, impact, status, source_type, source_id, evidence, suggested_action, affected_tasks) VALUES
('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Grand Auditorium Venue Booking Delayed', 'Administrative confirmation is overdue by 2 days, blocking downstream stage rigging, AV equipment setup, and dress rehearsal.', 'critical', 'high', 'high', 'active', 'dependency', '33333333-3333-3333-3333-000000000001', 'Task #1 is 2 days overdue and marked BLOCKED. 3 downstream dependent tasks are stalled.', 'Escalate immediately to Faculty Coordinator Prof. Dave to expedite the dean office endorsement stamp.', ARRAY['33333333-3333-3333-3333-000000000002'::uuid, '33333333-3333-3333-3333-000000000003'::uuid, '33333333-3333-3333-3333-000000000004'::uuid])
ON CONFLICT (id) DO NOTHING;
