import { z } from "zod";
import { AIToolName, SideEffectTier, UserRole } from "@/types";

export interface ToolDefinition<T extends z.ZodTypeAny = z.ZodTypeAny> {
  name: AIToolName;
  description: string;
  schema: T;
  sideEffectTier: SideEffectTier;
  minRole: UserRole;
  requiresConfirmation: boolean;
}

// 1. Tool Schemas with Zod
export const CreateTaskSchema = z.object({
  title: z.string().min(3, "Task title must be at least 3 characters").max(120),
  description: z.string().optional(),
  owner: z.string().optional().describe("Volunteer or organizer name to assign"),
  owner_id: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("high"),
  deadline: z.string().optional().describe("ISO date or relative description e.g. Friday"),
});

export const UpdateTaskSchema = z.object({
  task_id: z.string(),
  status: z.enum(["backlog", "todo", "in_progress", "review", "done", "blocked"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  owner_id: z.string().optional(),
  due_at: z.string().optional(),
});

export const AssignTaskSchema = z.object({
  task_id: z.string(),
  owner_name: z.string(),
  reason: z.string().optional(),
});

export const SearchTasksSchema = z.object({
  query: z.string().min(1),
  status: z.string().optional(),
  priority: z.string().optional(),
});

export const GetEventSummarySchema = z.object({
  include_risks: z.boolean().default(true),
});

export const GetWorkloadSchema = z.object({
  filter: z.enum(["all", "overloaded", "available"]).default("all"),
});

export const SearchDocumentsSchema = z.object({
  query: z.string().min(2),
});

export const AnswerFromKnowledgeSchema = z.object({
  question: z.string().min(3),
});

export const DetectRisksSchema = z.object({
  deep_analysis: z.boolean().default(true),
});

export const CreateRiskSchema = z.object({
  title: z.string().min(5),
  severity: z.enum(["low", "medium", "high", "critical"]),
  evidence: z.string().min(5),
  suggested_action: z.string().min(5),
});

export const CreateAnnouncementSchema = z.object({
  title: z.string().min(5),
  body: z.string().min(10),
  target_audience: z.enum(["all", "volunteers", "organizers"]).default("all"),
});

export const CreateNotificationSchema = z.object({
  user_id: z.string(),
  title: z.string(),
  body: z.string(),
});

export const GetCalendarSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

// 2. Typed Tool Registry with Permission & Safety Tier Rules
export const TOOL_REGISTRY: Record<AIToolName, ToolDefinition> = {
  create_task: {
    name: "create_task",
    description: "Create a new operational event task with owner, priority, and deadline.",
    schema: CreateTaskSchema,
    sideEffectTier: "confirm",
    minRole: "volunteer",
    requiresConfirmation: true,
  },
  update_task: {
    name: "update_task",
    description: "Update the status, priority, or details of an existing task.",
    schema: UpdateTaskSchema,
    sideEffectTier: "confirm",
    minRole: "volunteer",
    requiresConfirmation: true,
  },
  assign_task: {
    name: "assign_task",
    description: "Assign or reassign a task to a volunteer.",
    schema: AssignTaskSchema,
    sideEffectTier: "confirm",
    minRole: "organizer",
    requiresConfirmation: true,
  },
  search_tasks: {
    name: "search_tasks",
    description: "Search event tasks by keywords, status, or assignee.",
    schema: SearchTasksSchema,
    sideEffectTier: "auto",
    minRole: "member",
    requiresConfirmation: false,
  },
  get_event_summary: {
    name: "get_event_summary",
    description: "Retrieve comprehensive health metrics, task counts, and venue status for the current event.",
    schema: GetEventSummarySchema,
    sideEffectTier: "auto",
    minRole: "member",
    requiresConfirmation: false,
  },
  get_workload: {
    name: "get_workload",
    description: "Check volunteer capacity, assignment numbers, and detect overloaded team members.",
    schema: GetWorkloadSchema,
    sideEffectTier: "auto",
    minRole: "volunteer",
    requiresConfirmation: false,
  },
  create_event: {
    name: "create_event",
    description: "Initialize and create a major club event.",
    schema: z.object({ name: z.string(), venue: z.string(), budget: z.number().optional() }),
    sideEffectTier: "restricted",
    minRole: "admin",
    requiresConfirmation: true,
  },
  search_documents: {
    name: "search_documents",
    description: "Search uploaded club documents and policies with permission enforcement.",
    schema: SearchDocumentsSchema,
    sideEffectTier: "auto",
    minRole: "member",
    requiresConfirmation: false,
  },
  answer_from_knowledge: {
    name: "answer_from_knowledge",
    description: "Ask a grounded procedural question against verified club records and get citations.",
    schema: AnswerFromKnowledgeSchema,
    sideEffectTier: "auto",
    minRole: "member",
    requiresConfirmation: false,
  },
  detect_risks: {
    name: "detect_risks",
    description: "Run automated graph dependency, overdue task, and volunteer workload risk detection.",
    schema: DetectRisksSchema,
    sideEffectTier: "auto",
    minRole: "volunteer",
    requiresConfirmation: false,
  },
  create_risk: {
    name: "create_risk",
    description: "Record an identified operational risk with evidence and recommended actions.",
    schema: CreateRiskSchema,
    sideEffectTier: "confirm",
    minRole: "organizer",
    requiresConfirmation: true,
  },
  create_announcement: {
    name: "create_announcement",
    description: "Draft and publish a club-wide or event announcement.",
    schema: CreateAnnouncementSchema,
    sideEffectTier: "confirm",
    minRole: "organizer",
    requiresConfirmation: true,
  },
  create_notification: {
    name: "create_notification",
    description: "Dispatch an in-app operational notification to an individual user.",
    schema: CreateNotificationSchema,
    sideEffectTier: "auto",
    minRole: "organizer",
    requiresConfirmation: false,
  },
  get_calendar: {
    name: "get_calendar",
    description: "Retrieve scheduled deadlines, meetings, and milestones.",
    schema: GetCalendarSchema,
    sideEffectTier: "auto",
    minRole: "member",
    requiresConfirmation: false,
  },
};

// Permission hierarchy check helper
const ROLE_RANK: Record<UserRole, number> = {
  member: 1,
  volunteer: 2,
  organizer: 3,
  admin: 4,
};

export function canUserExecuteTool(userRole: UserRole, toolName: AIToolName): { allowed: boolean; reason?: string } {
  const tool = TOOL_REGISTRY[toolName];
  if (!tool) return { allowed: false, reason: "Tool not found in registry." };

  if (ROLE_RANK[userRole] < ROLE_RANK[tool.minRole]) {
    return {
      allowed: false,
      reason: `Insufficient privileges. Tool '${toolName}' requires '${tool.minRole}' role or higher (you are '${userRole}').`,
    };
  }

  return { allowed: true };
}
