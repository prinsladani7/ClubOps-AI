export type UserRole = "admin" | "organizer" | "volunteer" | "member";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: UserRole;
  status?: "active" | "suspended";
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
  status: "active" | "invited" | "suspended";
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
// SCOPED PERMISSION MODEL (Section 4 & 18)
// USER -> ROLE -> SCOPE -> RESOURCE -> ACTION
// -------------------------------------------------------------
export type PermissionScope = "organization" | "team" | "event" | "task";

export type PermissionAction =
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

// -------------------------------------------------------------
// HIERARCHICAL TEAM MANAGEMENT (Section 2 & 5)
// -------------------------------------------------------------
export interface Team {
  id: string;
  club_id: string;
  event_id?: string;
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
  status: "active" | "suspended";
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
  scope_id: string; // team_id or event_id
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

export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "critical";

// -------------------------------------------------------------
// DELEGATION & ESCALATION ON TASK (Section 7 & 11)
// -------------------------------------------------------------
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
  event_id: string;
  team_id?: string; // Scoped team assignment
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

  // Section 7: Delegation
  delegation_chain?: TaskDelegationStep[];
  assignment_history?: TaskAssignmentHistory[];

  // Section 11: Emergency Escalation
  blocked_at?: string;
  escalation_level?: "volunteer" | "organizer" | "admin";
  escalated_to?: string;
  escalated_at?: string;
  resolution_status?: "pending" | "investigating" | "resolved";
}

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: "blocks" | "relates_to";
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface Volunteer {
  id: string;
  club_id: string;
  user_id: string;
  team_id?: string;
  skills: string[];
  availability: "available" | "busy" | "overloaded" | "unavailable";
  notes: string;
  user?: User;
  assignedTasks?: Task[];
  workloadScore?: number; // 0 to 100
}

export interface Meeting {
  id: string;
  event_id: string;
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
  event_id: string;
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
  club_id: string;
  actor_user_id: string;
  actor_type: "user" | "ai" | "system";
  action: string;
  entity_type: string;
  entity_id: string;
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
