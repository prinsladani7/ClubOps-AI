export type UserRole = "admin" | "organizer" | "volunteer" | "member";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: UserRole;
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

export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Task {
  id: string;
  event_id: string;
  title: string;
  description: string;
  owner_id?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_at: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  owner?: User;
  dependencies?: string[]; // Task IDs this task depends on
  dependents?: string[];   // Task IDs depending on this task
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
  type: "task" | "risk" | "meeting" | "announcement" | "ai_approval";
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
  | "get_calendar";

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
