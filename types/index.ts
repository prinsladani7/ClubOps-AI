export type UserRole = "admin" | "organizer" | "volunteer" | "member";

export type AccountStatus =
  | "active"
  | "pending_verification"
  | "suspended"
  | "deactivated"
  | "locked_temporarily";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: UserRole;
  status?: AccountStatus;
  verification_token?: string;
  failed_login_attempts?: number;
  locked_until?: string;
  created_at: string;
  phone?: string;
  bio?: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  token: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: string;
  revoked: boolean;
  created_at: string;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  role: UserRole;
  status: "active" | "invited" | "suspended" | "deactivated";
  joined_at: string;
  user?: User;
}

// -------------------------------------------------------------
// PROJECTS (Section 2 & 5)
// -------------------------------------------------------------
export interface Project {
  id: string;
  club_id?: string;
  name: string;
  description: string;
  organizer_id: string; // Primary/Lead organizer assigned
  organizers?: string[]; // Allowed organizers assigned to project
  status: "active" | "completed" | "archived" | "suspended";
  start_date?: string;
  end_date?: string;
  budget?: number;
  created_at: string;
  updated_at?: string;
  organizer?: User;
  members?: ProjectMember[];
  task_count?: number;
  completed_task_count?: number;
  overdue_task_count?: number;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: "organizer" | "volunteer";
  status: "active" | "deactivated" | "suspended";
  joined_at: string;
  user?: User;
}

export type EventStatus = "planning" | "active" | "completed" | "archived";

export interface Event {
  id: string;
  club_id: string;
  name: string;
  description: string;
  start_at: string;
  end_at: string;
  venue: string;
  status: EventStatus;
  budget: number;
  created_by: string;
  created_at: string;
}

// -------------------------------------------------------------
// SCOPED PERMISSION MODEL (Section 3 & 4 & 18)
// Explicit permissions from Specification:
// project:create, project:view_all, project:view, project:update, project:archive
// member:add, member:remove
// organizer:create, organizer:remove
// volunteer:add, volunteer:remove
// task:create, task:assign, task:update, task:complete
// report:view, report:create
// audit:view, settings:manage, session:revoke
// -------------------------------------------------------------
export type PermissionScope = "organization" | "project" | "team" | "event" | "task";

export type ExplicitPermission =
  | "project:create"
  | "project:view_all"
  | "project:view"
  | "project:update"
  | "project:archive"
  | "member:add"
  | "member:remove"
  | "organizer:create"
  | "organizer:remove"
  | "volunteer:add"
  | "volunteer:remove"
  | "task:create"
  | "task:assign"
  | "task:update"
  | "task:complete"
  | "report:view"
  | "report:create"
  | "audit:view"
  | "settings:manage"
  | "session:revoke";

export type LegacyPermissionAction =
  | "CREATE_TEAM"
  | "EDIT_TEAM"
  | "ARCHIVE_TEAM"
  | "SUSPEND_TEAM"
  | "ASSIGN_ORGANIZER"
  | "ASSIGN_VOLUNTEER"
  | "REMOVE_MEMBER"
  | "VIEW_TEAM"
  | "CREATE_TASK"
  | "ASSIGN_TASK"
  | "UPDATE_TASK"
  | "DELETE_TASK"
  | "VIEW_TASK"
  | "DELEGATE_TASK"
  | "ESCALATE_TASK"
  | "CREATE_EVENT"
  | "VIEW_EVENT"
  | "EDIT_EVENT"
  | "MANAGE_PERMISSIONS"
  | "REQUEST_PERMISSION"
  | "APPROVE_PERMISSION"
  | "APPROVE_AI_ACTION"
  | "VIEW_AUDIT"
  | "MANAGE_SETTINGS";

export type PermissionAction = ExplicitPermission | LegacyPermissionAction;

// -------------------------------------------------------------
// HIERARCHICAL TEAM MANAGEMENT (Section 2 & 5)
// -------------------------------------------------------------
export interface Team {
  id: string;
  club_id: string;
  event_id?: string;
  project_id?: string;
  name: string;
  description: string;
  organizer_id: string; // The primary organizer assigned
  organizer?: User;
  members?: TeamMember[];
  status: "active" | "suspended" | "archived";
  created_at: string;
  updated_at?: string;
  member_count?: number;
  active_tasks_count?: number;
  completed_tasks_count?: number;
  overdue_tasks_count?: number;
  blocked_tasks_count?: number;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: "organizer" | "volunteer" | "acting_organizer";
  joined_at: string;
  status: "active" | "suspended" | "deactivated";
  user?: User;
}

// -------------------------------------------------------------
// TEMPORARY EVENT ROLES & ACTING ORGANIZER (Section 8 & 9)
// -------------------------------------------------------------
export interface RoleAssignment {
  id: string;
  user_id: string;
  role: string; // e.g. "REGISTRATION_LEAD", "STAGE_LEAD", "TECHNICAL_LEAD", "ACTING_ORGANIZER"
  scope_type: PermissionScope;
  scope_id: string; // team_id, project_id, or event_id
  starts_at: string;
  expires_at: string;
  status: "active" | "expired" | "revoked";
  granted_by: string;
  created_at: string;
  user?: User;
}

// -------------------------------------------------------------
// PERMISSION REQUESTS (Section 10)
// -------------------------------------------------------------
export interface PermissionRequest {
  id: string;
  requester_id: string;
  permission: PermissionAction;
  scope_type: PermissionScope;
  scope_id: string;
  resource_type: string;
  resource_id?: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "temporarily_approved";
  reviewer_id?: string;
  reviewed_at?: string;
  expires_at?: string;
  created_at: string;
  requester?: User;
  reviewer?: User;
}

// -------------------------------------------------------------
// AI TEAM BUILDER RECOMMENDATION FORMAT (Section 6)
// -------------------------------------------------------------
export interface AITeamRecommendation {
  team_name: string;
  recommended_organizer: string;
  recommended_organizer_id?: string;
  recommended_members: string[];
  recommended_member_ids?: string[];
  skill_coverage: string[];
  workload_analysis: Record<string, number | string>;
  reasoning: string[];
}

export interface AIProjectBreakdownTask {
  title: string;
  description: string;
  estimated_hours: number;
  priority: TaskPriority;
  required_skills: string[];
  suggested_assignee_id?: string;
  suggested_assignee_name?: string;
  dependencies?: string[]; // indices or temporary ids
}

export interface AIProjectBreakdownResult {
  project_id?: string;
  project_name: string;
  summary: string;
  suggested_tasks: AIProjectBreakdownTask[];
  estimated_total_hours: number;
  risk_factors: string[];
}

export interface AIWorkloadRebalanceSuggestion {
  from_user_id: string;
  from_user_name: string;
  to_user_id: string;
  to_user_name: string;
  task_id: string;
  task_title: string;
  reason: string;
  workload_delta: {
    from_before: number;
    from_after: number;
    to_before: number;
    to_after: number;
  };
}

// -------------------------------------------------------------
// TASK WORKFLOW (Section 4)
// Pending → Accepted → In Progress → Blocked → Submitted → Completed
// -------------------------------------------------------------
export type TaskWorkflowStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "blocked"
  | "submitted"
  | "completed";

export type TaskStatus =
  | TaskWorkflowStatus
  | "backlog"
  | "todo"
  | "review"
  | "done";

export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface TaskChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskEvidence {
  id: string;
  task_id: string;
  evidence_url: string;
  notes?: string;
  submitted_at: string;
  submitted_by: string;
  approved?: boolean;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface TaskDelegationStep {
  step?: number;
  from_user_id: string;
  to_user_id: string;
  delegated_at: string;
  reason?: string;
}

export interface TaskAssignmentHistory {
  user_id: string;
  user_name?: string;
  timestamp: string;
  action: string;
}

export interface Task {
  id: string;
  event_id?: string;
  project_id?: string;
  team_id?: string;
  title: string;
  description: string;
  owner_id?: string; // assigned_to
  assigned_by?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_at: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  owner?: User;
  dependencies?: string[]; // Task IDs this task depends on
  dependents?: string[];   // Task IDs depending on this task
  checklist?: TaskChecklistItem[];
  comments?: TaskComment[];
  evidence?: TaskEvidence[];
  estimated_hours?: number;
  actual_hours?: number;
  is_overdue?: boolean;

  // Delegation & Escalation
  delegation_chain?: TaskDelegationStep[];
  assignment_history?: TaskAssignmentHistory[];
  is_blocked?: boolean;
  blocker_reason?: string;
  blocked_at?: string;
  escalation_level?: "volunteer" | "organizer" | "admin" | "NONE" | "ORGANIZER" | "ADMIN";
  escalated_to?: string;
  escalated_at?: string;
  resolution_status?: "pending" | "investigating" | "resolved";
  category?: string;
  skills?: string[];
}

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: "blocks" | "relates_to";
}

export interface Volunteer {
  id: string;
  club_id: string;
  user_id: string;
  team_id?: string;
  project_ids?: string[];
  skills: string[];
  availability: "available" | "busy" | "overloaded" | "unavailable";
  notes: string;
  user?: User;
  assignedTasks?: Task[];
  workloadScore?: number; // 0 to 100
  total_hours_logged?: number;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill: string;
  proficiency: "beginner" | "intermediate" | "expert";
}

export interface AvailabilitySchedule {
  id: string;
  user_id: string;
  day_of_week: number; // 0=Sunday, 6=Saturday
  start_time: string;
  end_time: string;
  status: "available" | "busy" | "unavailable";
}

export interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  hours_spent: number;
  date: string;
  notes?: string;
  created_at: string;
}

export interface ProgressReport {
  id: string;
  project_id: string;
  author_id: string;
  title: string;
  summary: string;
  completed_tasks: number;
  pending_tasks: number;
  blocked_tasks: number;
  risks_identified: string[];
  created_at: string;
  author?: User;
}

export interface Invitation {
  id: string;
  club_id: string;
  email: string;
  role: UserRole;
  token: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  created_by: string;
  created_at: string;
  expires_at: string;
}

export interface Meeting {
  id: string;
  event_id?: string;
  project_id?: string;
  team_id?: string;
  title: string;
  scheduled_at: string;
  transcript_status: "none" | "processing" | "processed";
  transcript_text?: string;
  action_items_count?: number;
}

export interface MeetingActionItem {
  id: string;
  meeting_id: string;
  task_id?: string;
  extracted_title: string;
  owner_name?: string;
  owner_id?: string;
  due_at?: string;
  priority: TaskPriority;
  confidence: number;
  approved?: boolean;
}

export type DocumentVisibility = "public" | "volunteer" | "organizer" | "admin";

export interface Document {
  id: string;
  club_id: string;
  event_id?: string;
  project_id?: string;
  team_id?: string;
  name: string;
  storage_path: string;
  mime_type: string;
  uploaded_by: string;
  visibility: DocumentVisibility;
  created_at: string;
  chunk_count?: number;
  uploader?: User;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  metadata: {
    club_id: string;
    event_id?: string;
    project_id?: string;
    team_id?: string;
    document_name: string;
    visibility: DocumentVisibility;
    section?: string;
  };
  similarity?: number;
}

export type RiskSeverity = "low" | "medium" | "high" | "critical";

export interface Risk {
  id: string;
  event_id?: string;
  project_id?: string;
  team_id?: string;
  title: string;
  description: string;
  severity: RiskSeverity;
  probability: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  status: "active" | "mitigated" | "resolved";
  source_type: "task" | "volunteer" | "venue" | "dependency" | "system";
  source_id?: string;
  evidence: string;
  suggested_action: string;
  affected_tasks?: string[];
  created_at: string;
}

export interface Announcement {
  id: string;
  event_id?: string;
  project_id?: string;
  team_id?: string;
  title: string;
  body: string;
  status: "draft" | "scheduled" | "published";
  scheduled_at?: string;
  created_by: string;
  created_at: string;
  author?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  type: "task" | "risk" | "meeting" | "announcement" | "ai_approval" | "permission_request" | "escalation";
  title: string;
  body: string;
  read_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  club_id?: string;
  actor_user_id: string;
  actor_type: "user" | "ai" | "system";
  action: string;
  entity_type: string;
  entity_id: string;
  resource?: string;
  actor_role?: string;
  metadata_json: Record<string, any>;
  created_at: string;
  actor?: User;
}

export type SideEffectTier = "auto" | "confirm" | "restricted";

export type AIToolName =
  | "create_task"
  | "update_task"
  | "assign_task"
  | "delegate_task"
  | "escalate_task"
  | "search_tasks"
  | "get_event_summary"
  | "get_workload"
  | "create_event"
  | "search_documents"
  | "answer_from_knowledge"
  | "detect_risks"
  | "create_risk"
  | "create_announcement"
  | "create_notification"
  | "get_calendar"
  | "create_team"
  | "recommend_team"
  | "breakdown_project"
  | "rebalance_workload"
  | "request_permission"
  | "review_permission_request";

export interface AIToolCall {
  id: string;
  conversation_id: string;
  tool_name: AIToolName;
  arguments_json: Record<string, any>;
  status: "pending_approval" | "executed" | "rejected" | "failed";
  result_json?: Record<string, any>;
  created_at: string;
  side_effect_tier: SideEffectTier;
  explanation?: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  tool_call?: AIToolCall;
  sources?: {
    document_name: string;
    chunk_index: number;
    content: string;
    similarity: number;
  }[];
}
