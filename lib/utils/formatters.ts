/**
 * Resolves a technical entity type + entity ID into a human-friendly label.
 * E.g., ('task', 'task-01') -> "Cisco Catalyst 3850 Cabling"
 * E.g., ('user', 'usr-01') -> "Prins Ladani"
 */
export function resolveEntityLabel(
  entityType: string,
  entityId: string,
  dbInstance?: any
): { typeLabel: string; name: string; isFallback: boolean } {
  const normType = (entityType || "").toLowerCase();

  if (dbInstance) {
    if (normType === "task") {
      const task = dbInstance.getTaskById ? dbInstance.getTaskById(entityId) : null;
      if (task) return { typeLabel: "Deliverable", name: task.title, isFallback: false };
    }
    if (normType === "user") {
      const user = dbInstance.getUserById ? dbInstance.getUserById(entityId) : null;
      if (user) return { typeLabel: "Member", name: user.name, isFallback: false };
    }
    if (normType === "project" || normType === "event") {
      const proj = dbInstance.getProjectById ? dbInstance.getProjectById(entityId) : null;
      if (proj) return { typeLabel: "Project", name: proj.name, isFallback: false };
      const evt = dbInstance.getEvent ? dbInstance.getEvent() : null;
      if (evt && (evt.id === entityId || entityId === "evt-01" || entityId === "event-techfest-2026")) {
        return { typeLabel: "Event", name: evt.name, isFallback: false };
      }
    }
    if (normType === "team") {
      const team = dbInstance.getTeamById ? dbInstance.getTeamById(entityId) : null;
      if (team) return { typeLabel: "Squad", name: team.name, isFallback: false };
    }
    if (normType === "document") {
      const docs = dbInstance.getDocuments ? dbInstance.getDocuments() : [];
      const doc = docs.find((d: any) => d.id === entityId);
      if (doc) return { typeLabel: "Document", name: doc.name, isFallback: false };
    }
  }

  // Friendly humanized type label
  let typeLabel = "Item";
  if (normType === "task") typeLabel = "Deliverable";
  else if (normType === "user") typeLabel = "Member";
  else if (normType === "project") typeLabel = "Project";
  else if (normType === "team") typeLabel = "Squad";
  else if (normType === "document") typeLabel = "Document";
  else if (normType === "risk") typeLabel = "Operational Risk";
  else if (normType === "api_permission") typeLabel = "Clearance Gate";

  return { typeLabel, name: entityId, isFallback: true };
}

/**
 * Translates technical audit action and metadata into clear human operations language.
 */
export function formatActionNarrative(action: string, metadata: any = {}): string {
  const meta = metadata || {};
  const act = (action || "").toLowerCase();

  switch (act) {
    case "task_created":
    case "create_task":
      return `Created deliverable "${meta.title || meta.taskTitle || "New Task"}" with ${meta.priority || "standard"} priority`;
    case "task_status_updated":
    case "task_updated":
    case "update_task":
      if (meta.oldStatus && meta.newStatus) {
        return `Changed status from ${meta.oldStatus.replace(/_/g, " ")} to ${meta.newStatus.replace(/_/g, " ")}`;
      }
      if (meta.status) {
        return `Updated status to ${meta.status.replace(/_/g, " ")}`;
      }
      return "Updated deliverable details";
    case "task_delegated":
    case "delegate_task":
      return `Delegated assignment: "${meta.reason || "Reassigned to squad member"}"`;
    case "task_escalated":
    case "escalate_task":
      return `Reported blocker: "${meta.blocker_reason || meta.reason || "Operational dependency stall"}"`;
    case "blocker_resolved":
      return "Resolved deliverable blocker and resumed workflow";
    case "evidence_submitted":
      return "Submitted proof-of-work link for review";
    case "evidence_reviewed":
      return meta.approved ? "Approved proof-of-work and verified deliverable" : "Requested proof-of-work revisions";
    case "volunteer_assigned":
    case "reassign_task":
      return `Assigned operational lead`;
    case "permission_elevation_requested":
      return `Requested ${meta.requestedRole || "elevated"} clearance`;
    case "permission_elevation_approved":
      return `Approved temporary clearance (${meta.duration || "event window"})`;
    case "permission_elevation_rejected":
      return `Declined clearance elevation request`;
    case "unauthorized_route_attempt":
      return `Clearance boundary enforced: denied access to restricted section`;
    case "unauthorized_api_attempt":
      return `API boundary enforced: unauthorized action intercepted`;
    case "project_created":
      return `Created new project track "${meta.name || "Track"}"`;
    case "project_updated":
      return "Updated project track parameters";
    case "document_uploaded":
      return `Added document to knowledge base`;
    case "ai_tool_executed":
      return `AI Copilot executed: ${meta.tool_name || "automation action"}`;
    default:
      return action.replace(/_/g, " ");
  }
}

/**
 * Formats AI tool arguments into a human-understandable summary card.
 */
export function formatToolArgumentsReadable(toolName: string, args: any): { title: string; bullets: { label: string; value: string }[] } {
  const safeArgs = args || {};

  switch (toolName) {
    case "reassign_task":
      return {
        title: "Reassign Deliverable",
        bullets: [
          { label: "Deliverable ID", value: safeArgs.task_id || "N/A" },
          { label: "New Assignee", value: safeArgs.new_owner_id || "N/A" },
          { label: "Rationale", value: safeArgs.reason || "Workload rebalance" },
        ],
      };
    case "create_task":
      return {
        title: "Create New Deliverable",
        bullets: [
          { label: "Title", value: safeArgs.title || "Untitled" },
          { label: "Priority", value: (safeArgs.priority || "HIGH").toUpperCase() },
          { label: "Deadline", value: safeArgs.deadline ? new Date(safeArgs.deadline).toLocaleDateString() : "Event window" },
          { label: "Description", value: safeArgs.description || "None" },
        ],
      };
    case "escalate_task":
      return {
        title: "Escalate Blocker to Leadership",
        bullets: [
          { label: "Deliverable ID", value: safeArgs.task_id || "N/A" },
          { label: "Escalation Level", value: (safeArgs.escalation_level || "ORGANIZER").toUpperCase() },
          { label: "Blocker Reason", value: safeArgs.blocker_reason || "Unspecified delay" },
        ],
      };
    case "delegate_task":
      return {
        title: "Delegate Deliverable",
        bullets: [
          { label: "Deliverable ID", value: safeArgs.task_id || "N/A" },
          { label: "Target Assignee", value: safeArgs.to_user_id || "N/A" },
          { label: "Delegation Note", value: safeArgs.reason || "Delegated responsibility" },
        ],
      };
    default:
      return {
        title: toolName.replace(/_/g, " ").toUpperCase(),
        bullets: Object.entries(safeArgs).map(([key, val]) => ({
          label: key.replace(/_/g, " "),
          value: typeof val === "object" ? JSON.stringify(val) : String(val),
        })),
      };
  }
}
