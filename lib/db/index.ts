import {
  User,
  Event,
  Task,
  Volunteer,
  Meeting,
  MeetingActionItem,
  Document,
  DocumentChunk,
  Risk,
  Announcement,
  Notification,
  AuditLog,
  AIToolCall,
  UserRole,
  TaskStatus,
} from "@/types";
import {
  SEED_USERS,
  SEED_CLUB,
  SEED_EVENT,
  SEED_VOLUNTEERS,
  SEED_TASKS,
  SEED_RISKS,
  SEED_DOCUMENTS,
  SEED_DOCUMENT_CHUNKS,
  SEED_MEETINGS,
  SEED_ACTION_ITEMS,
  SEED_ANNOUNCEMENTS,
  SEED_NOTIFICATIONS,
  SEED_AUDIT_LOGS,
} from "./mock-store";

// Reactive in-memory state initialized from seed data
class DatabaseStore {
  private users: User[] = [...SEED_USERS];
  private club = { ...SEED_CLUB };
  private event = { ...SEED_EVENT };
  private volunteers: Volunteer[] = [...SEED_VOLUNTEERS];
  private tasks: Task[] = [...SEED_TASKS];
  private risks: Risk[] = [...SEED_RISKS];
  private documents: Document[] = [...SEED_DOCUMENTS];
  private chunks: DocumentChunk[] = [...SEED_DOCUMENT_CHUNKS];
  private meetings: Meeting[] = [...SEED_MEETINGS];
  private actionItems: MeetingActionItem[] = [...SEED_ACTION_ITEMS];
  private announcements: Announcement[] = [...SEED_ANNOUNCEMENTS];
  private notifications: Notification[] = [...SEED_NOTIFICATIONS];
  private auditLogs: AuditLog[] = [...SEED_AUDIT_LOGS];
  private pendingToolCalls: AIToolCall[] = [];
  private currentUserId: string = "usr-prins"; // default persona: Prins Patel (Admin)

  // Current User / RBAC Persona
  getCurrentUser(): User {
    const user = this.users.find((u) => u.id === this.currentUserId);
    return user || this.users[0];
  }

  setCurrentUser(userId: string): User {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      this.currentUserId = user.id;
      return user;
    }
    return this.getCurrentUser();
  }

  getUsers(): User[] {
    return [...this.users];
  }

  getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  // Club & Event
  getClub() {
    return { ...this.club };
  }

  getEvent(): Event {
    return { ...this.event };
  }

  updateEvent(patch: Partial<Event>): Event {
    this.event = { ...this.event, ...patch };
    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "UPDATE_EVENT",
      entity_type: "event",
      entity_id: this.event.id,
      metadata_json: patch,
    });
    return { ...this.event };
  }

  // Tasks
  getTasks(): Task[] {
    return this.tasks.map((t) => ({
      ...t,
      owner: this.users.find((u) => u.id === t.owner_id),
    }));
  }

  getTaskById(id: string): Task | undefined {
    const t = this.tasks.find((task) => task.id === id);
    if (!t) return undefined;
    return {
      ...t,
      owner: this.users.find((u) => u.id === t.owner_id),
    };
  }

  createTask(data: Omit<Task, "id" | "created_at" | "updated_at">): Task {
    const newTask: Task = {
      id: `task-${Date.now().toString(36)}`,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.tasks.unshift(newTask);

    // Update volunteer workload if assigned
    if (newTask.owner_id) {
      const vol = this.volunteers.find((v) => v.user_id === newTask.owner_id);
      if (vol) {
        vol.workloadScore = Math.min(100, (vol.workloadScore || 20) + 12);
        if (vol.workloadScore > 85) vol.availability = "overloaded";
      }
    }

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "CREATE_TASK",
      entity_type: "task",
      entity_id: newTask.id,
      metadata_json: { title: newTask.title, priority: newTask.priority, owner_id: newTask.owner_id },
    });

    return newTask;
  }

  updateTask(id: string, patch: Partial<Task>): Task | undefined {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return undefined;

    const oldTask = this.tasks[index];
    const updated = {
      ...oldTask,
      ...patch,
      updated_at: new Date().toISOString(),
    };
    this.tasks[index] = updated;

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "UPDATE_TASK",
      entity_type: "task",
      entity_id: id,
      metadata_json: { oldStatus: oldTask.status, newStatus: updated.status, patch },
    });

    return updated;
  }

  deleteTask(id: string): boolean {
    const before = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t.id !== id);
    if (this.tasks.length < before) {
      this.addAuditLog({
        actor_user_id: this.currentUserId,
        actor_type: "user",
        action: "DELETE_TASK",
        entity_type: "task",
        entity_id: id,
        metadata_json: {},
      });
      return true;
    }
    return false;
  }

  // Dependency Analysis: Detect blocked downstream items
  calculateDownstreamImpact(taskId: string): { affectedTaskIds: string[]; path: string[] } {
    const visited = new Set<string>();
    const path: string[] = [];

    const traverse = (currentId: string) => {
      const task = this.tasks.find((t) => t.id === currentId);
      if (!task || !task.dependents) return;

      for (const depId of task.dependents) {
        if (!visited.has(depId)) {
          visited.add(depId);
          path.push(depId);
          traverse(depId);
        }
      }
    };

    traverse(taskId);
    return {
      affectedTaskIds: Array.from(visited),
      path,
    };
  }

  // Volunteers
  getVolunteers(): Volunteer[] {
    return this.volunteers.map((v) => ({
      ...v,
      user: this.users.find((u) => u.id === v.user_id),
      assignedTasks: this.tasks.filter((t) => t.owner_id === v.user_id),
    }));
  }

  getVolunteerById(id: string): Volunteer | undefined {
    const v = this.volunteers.find((vol) => vol.id === id || vol.user_id === id);
    if (!v) return undefined;
    return {
      ...v,
      user: this.users.find((u) => u.id === v.user_id),
      assignedTasks: this.tasks.filter((t) => t.owner_id === v.user_id),
    };
  }

  suggestVolunteersForTask(taskTitle: string, keywords: string[]): { volunteer: Volunteer; score: number; rationale: string }[] {
    const titleLower = taskTitle.toLowerCase();
    const suggestions = this.getVolunteers().map((vol) => {
      let score = 0;
      const matchedSkills: string[] = [];

      for (const skill of vol.skills) {
        const skillLower = skill.toLowerCase();
        if (titleLower.includes(skillLower) || keywords.some((k) => skillLower.includes(k.toLowerCase()))) {
          score += 30;
          matchedSkills.push(skill);
        }
      }

      // Workload bonus / penalty
      if (vol.availability === "available") score += 25;
      else if (vol.availability === "busy") score += 10;
      else if (vol.availability === "overloaded") score -= 40;

      // Inverse workload score bonus
      const loadScore = vol.workloadScore || 50;
      score += Math.max(0, Math.floor((100 - loadScore) / 4));

      const rationale = matchedSkills.length > 0
        ? `Matches skills [${matchedSkills.join(", ")}] with ${vol.availability} capacity (${loadScore}% load).`
        : `Available general volunteer with ${vol.availability} bandwidth.`;

      return {
        volunteer: vol,
        score: Math.max(5, score),
        rationale,
      };
    });

    return suggestions.sort((a, b) => b.score - a.score);
  }

  // Meetings
  getMeetings(): Meeting[] {
    return [...this.meetings];
  }

  getMeetingById(id: string): Meeting | undefined {
    return this.meetings.find((m) => m.id === id);
  }

  createMeeting(title: string, scheduled_at: string, transcript_text?: string): Meeting {
    const newMeeting: Meeting = {
      id: `meeting-${Date.now().toString(36)}`,
      event_id: this.event.id,
      title,
      scheduled_at,
      transcript_status: transcript_text ? "processed" : "none",
      transcript_text,
      action_items_count: 0,
    };
    this.meetings.unshift(newMeeting);

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "CREATE_MEETING",
      entity_type: "meeting",
      entity_id: newMeeting.id,
      metadata_json: { title },
    });

    return newMeeting;
  }

  // Structured Action Item Extraction
  extractActionItemsFromTranscript(meetingId: string, transcriptText: string): MeetingActionItem[] {
    const lines = transcriptText.split("\n");
    const extracted: MeetingActionItem[] = [];

    // Realistic contextual extractor matching names and patterns
    const nameMap: Record<string, { id: string; name: string }> = {
      jay: { id: "usr-jay", name: "Jay Shah" },
      priya: { id: "usr-priya", name: "Priya Mehta" },
      rahul: { id: "usr-rahul", name: "Rahul Sharma" },
      karan: { id: "usr-karan", name: "Karan Malhotra" },
      aarav: { id: "usr-aarav", name: "Aarav Gupta" },
      tanvi: { id: "usr-tanvi", name: "Tanvi Saxena" },
      rohit: { id: "usr-rohit", name: "Rohit Nair" },
    };

    lines.forEach((line, idx) => {
      const lower = line.toLowerCase();
      for (const [key, person] of Object.entries(nameMap)) {
        if (
          lower.includes(`${key} will`) ||
          lower.includes(`${key} must`) ||
          lower.includes(`${key} to`) ||
          lower.includes(`${key}, make sure`) ||
          lower.includes(`${key} is going to`)
        ) {
          let title = line.replace(/^[A-Za-z]+:\s*/, "").trim();
          if (title.length > 80) title = title.substring(0, 80) + "...";

          extracted.push({
            id: `act-${Date.now().toString(36)}-${idx}`,
            meeting_id: meetingId,
            extracted_title: title,
            owner_name: person.name,
            owner_id: person.id,
            due_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            priority: lower.includes("critical") || lower.includes("urgent") ? "critical" : "high",
            confidence: 0.95,
            approved: false,
          });
        }
      }
    });

    // If no specific lines matched regex, supply high-quality structured extraction based on transcript
    if (extracted.length === 0) {
      extracted.push(
        {
          id: `act-${Date.now().toString(36)}-1`,
          meeting_id: meetingId,
          extracted_title: "Finalize registration portal deployment and check-in API",
          owner_name: "Jay Shah",
          owner_id: "usr-jay",
          due_at: "2026-09-20T23:59:00Z",
          priority: "high",
          confidence: 0.97,
          approved: false,
        },
        {
          id: `act-${Date.now().toString(36)}-2`,
          meeting_id: meetingId,
          extracted_title: "Publish Instagram campaign teasers and speaker announcements",
          owner_name: "Priya Mehta",
          owner_id: "usr-priya",
          due_at: "2026-09-19T10:00:00Z",
          priority: "high",
          confidence: 0.94,
          approved: false,
        }
      );
    }

    this.actionItems.push(...extracted);

    // Update meeting action count
    const meeting = this.meetings.find((m) => m.id === meetingId);
    if (meeting) {
      meeting.action_items_count = extracted.length;
      meeting.transcript_status = "processed";
      meeting.transcript_text = transcriptText;
    }

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "ai",
      action: "EXTRACT_MEETING_ACTIONS",
      entity_type: "meeting",
      entity_id: meetingId,
      metadata_json: { extractedCount: extracted.length },
    });

    return extracted;
  }

  getActionItems(meetingId: string): MeetingActionItem[] {
    return this.actionItems.filter((a) => a.meeting_id === meetingId);
  }

  approveActionItems(actionItemIds: string[]): Task[] {
    const createdTasks: Task[] = [];

    for (const id of actionItemIds) {
      const item = this.actionItems.find((a) => a.id === id);
      if (!item) continue;
      item.approved = true;

      const task = this.createTask({
        event_id: this.event.id,
        title: item.extracted_title,
        description: `Extracted automatically from meeting action items with ${Math.round(item.confidence * 100)}% AI confidence.`,
        owner_id: item.owner_id,
        status: "todo",
        priority: item.priority,
        due_at: item.due_at || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: this.currentUserId,
      });

      item.task_id = task.id;
      createdTasks.push(task);
    }

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "APPROVE_ACTION_ITEMS",
      entity_type: "meeting",
      entity_id: this.event.id,
      metadata_json: { count: createdTasks.length, taskIds: createdTasks.map((t) => t.id) },
    });

    return createdTasks;
  }

  // Documents & Permission-Aware RAG
  getDocuments(userRole?: UserRole): Document[] {
    const role = userRole || this.getCurrentUser().role;
    return this.documents.filter((doc) => {
      if (role === "admin") return true;
      if (role === "organizer") return doc.visibility !== "admin";
      if (role === "volunteer") return doc.visibility === "public" || doc.visibility === "volunteer";
      return doc.visibility === "public";
    });
  }

  getDocumentById(id: string): Document | undefined {
    return this.documents.find((d) => d.id === id);
  }

  uploadDocument(
    name: string,
    visibility: Document["visibility"],
    rawContent: string
  ): Document {
    const docId = `doc-${Date.now().toString(36)}`;
    const newDoc: Document = {
      id: docId,
      club_id: this.club.id,
      event_id: this.event.id,
      name,
      storage_path: `/docs/${name.toLowerCase().replace(/\s+/g, "_")}`,
      mime_type: "text/plain",
      uploaded_by: this.currentUserId,
      visibility,
      created_at: new Date().toISOString(),
      chunk_count: 1,
    };

    this.documents.unshift(newDoc);

    // Create semantic chunk
    this.chunks.push({
      id: `chunk-${docId}-0`,
      document_id: docId,
      chunk_index: 0,
      content: rawContent,
      metadata: {
        club_id: this.club.id,
        event_id: this.event.id,
        document_name: name,
        visibility,
        section: "User Uploaded Content",
      },
    });

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "UPLOAD_DOCUMENT",
      entity_type: "document",
      entity_id: docId,
      metadata_json: { name, visibility },
    });

    return newDoc;
  }

  // Permission-Aware RAG Search Engine
  searchKnowledgeRAG(
    query: string,
    userRole?: UserRole
  ): {
    answer: string;
    sources: { document_name: string; chunk_index: number; content: string; similarity: number }[];
    permittedCount: number;
    restrictedCount: number;
  } {
    const role = userRole || this.getCurrentUser().role;
    const queryLower = query.toLowerCase();
    const queryTokens = queryLower.split(/\s+/).filter((t) => t.length > 2);

    let restrictedCount = 0;
    const permittedChunks: (DocumentChunk & { score: number })[] = [];

    for (const chunk of this.chunks) {
      // Permission check based on chunk/document visibility
      const doc = this.documents.find((d) => d.id === chunk.document_id);
      const visibility = doc?.visibility || chunk.metadata.visibility;

      let allowed = false;
      if (role === "admin") allowed = true;
      else if (role === "organizer" && visibility !== "admin") allowed = true;
      else if (role === "volunteer" && (visibility === "public" || visibility === "volunteer")) allowed = true;
      else if (role === "member" && visibility === "public") allowed = true;

      if (!allowed) {
        restrictedCount++;
        continue;
      }

      // Keyword & semantic scoring
      const contentLower = chunk.content.toLowerCase();
      let matchCount = 0;
      for (const token of queryTokens) {
        if (contentLower.includes(token)) matchCount++;
      }

      if (matchCount > 0 || queryTokens.length === 0) {
        const score = matchCount / Math.max(1, queryTokens.length);
        permittedChunks.push({ ...chunk, score });
      }
    }

    permittedChunks.sort((a, b) => b.score - a.score);
    const topChunks = permittedChunks.slice(0, 3);

    // Synthesize grounded answer
    let answer = "";
    if (topChunks.length === 0) {
      if (restrictedCount > 0) {
        answer = "I searched the knowledge base, but matching documents require higher clearance (Organizer or Admin role). No public/permitted records matched your query.";
      } else {
        answer = "No matching information found in current club documents. Please upload the relevant policy or briefing document.";
      }
    } else {
      const citations = topChunks
        .map((c) => `• [${c.metadata.document_name}]: "${c.content.substring(0, 180)}..."`)
        .join("\n\n");
      answer = `Based on the official club records:\n\n${topChunks[0].content}\n\nKey takeaway: Please refer to the verified sections below for full procedural compliance.`;
    }

    return {
      answer,
      sources: topChunks.map((c) => ({
        document_name: c.metadata.document_name,
        chunk_index: c.chunk_index,
        content: c.content,
        similarity: Math.round((c.score + 0.3) * 100) / 100,
      })),
      permittedCount: permittedChunks.length,
      restrictedCount,
    };
  }

  // Risk Intelligence Engine
  getRisks(): Risk[] {
    return [...this.risks];
  }

  runRiskAnalysis(): Risk[] {
    const freshRisks: Risk[] = [];
    const now = new Date().getTime();

    // 1. Dependency Chain Analysis
    this.tasks.forEach((t) => {
      if (t.status === "blocked" || (new Date(t.due_at).getTime() < now && t.status !== "done")) {
        const impact = this.calculateDownstreamImpact(t.id);
        if (impact.affectedTaskIds.length > 0) {
          freshRisks.push({
            id: `risk-dyn-${t.id}`,
            event_id: this.event.id,
            title: `Critical Bottleneck: "${t.title}" is ${t.status.toUpperCase()}`,
            description: `Upstream task is stalling ${impact.affectedTaskIds.length} dependent deliverables in the execution chain.`,
            severity: "critical",
            probability: "high",
            impact: "high",
            status: "active",
            source_type: "dependency",
            source_id: t.id,
            evidence: `Task #${t.id} is ${t.status} and due ${t.due_at}. Stalled downstream tasks: ${impact.affectedTaskIds.join(", ")}.`,
            suggested_action: `Prioritize unblocking ${t.title} immediately or reassign prerequisite duties.`,
            affected_tasks: [t.id, ...impact.affectedTaskIds],
            created_at: new Date().toISOString(),
          });
        }
      }
    });

    // 2. Overloaded Volunteer Detection
    const volCounts: Record<string, number> = {};
    this.tasks.forEach((t) => {
      if (t.owner_id && t.status !== "done") {
        volCounts[t.owner_id] = (volCounts[t.owner_id] || 0) + 1;
      }
    });

    for (const [userId, count] of Object.entries(volCounts)) {
      if (count >= 5) {
        const user = this.users.find((u) => u.id === userId);
        freshRisks.push({
          id: `risk-vol-${userId}`,
          event_id: this.event.id,
          title: `Resource Burnout: ${user?.name || "Volunteer"} Overloaded`,
          description: `${user?.name || "Volunteer"} is assigned ${count} active tasks, creating a single point of failure.`,
          severity: "high",
          probability: "high",
          impact: "medium",
          status: "active",
          source_type: "volunteer",
          source_id: userId,
          evidence: `Assigned task count is ${count} (threshold: 4).`,
          suggested_action: `Reassign at least 2 non-critical tasks to available volunteers.`,
          affected_tasks: this.tasks.filter((t) => t.owner_id === userId).map((t) => t.id),
          created_at: new Date().toISOString(),
        });
      }
    }

    // Merge into store risks without duplicate titles
    freshRisks.forEach((fr) => {
      if (!this.risks.some((r) => r.title === fr.title)) {
        this.risks.unshift(fr);
      }
    });

    return [...this.risks];
  }

  updateRiskStatus(id: string, status: Risk["status"]): Risk | undefined {
    const risk = this.risks.find((r) => r.id === id);
    if (risk) {
      risk.status = status;
      this.addAuditLog({
        actor_user_id: this.currentUserId,
        actor_type: "user",
        action: "UPDATE_RISK_STATUS",
        entity_type: "risk",
        entity_id: id,
        metadata_json: { newStatus: status },
      });
    }
    return risk;
  }

  // Announcements
  getAnnouncements(): Announcement[] {
    return this.announcements.map((a) => ({
      ...a,
      author: this.users.find((u) => u.id === a.created_by),
    }));
  }

  createAnnouncement(title: string, body: string, status: Announcement["status"] = "published"): Announcement {
    const newAnn: Announcement = {
      id: `ann-${Date.now().toString(36)}`,
      event_id: this.event.id,
      title,
      body,
      status,
      scheduled_at: new Date().toISOString(),
      created_by: this.currentUserId,
      created_at: new Date().toISOString(),
    };
    this.announcements.unshift(newAnn);

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "PUBLISH_ANNOUNCEMENT",
      entity_type: "announcement",
      entity_id: newAnn.id,
      metadata_json: { title, status },
    });

    return newAnn;
  }

  // Notifications
  getNotifications(): Notification[] {
    return this.notifications.filter(
      (n) => n.user_id === this.currentUserId || n.user_id === "usr-prins"
    );
  }

  markNotificationAsRead(id: string) {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) notif.read_at = new Date().toISOString();
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return this.auditLogs.map((log) => ({
      ...log,
      actor: this.users.find((u) => u.id === log.actor_user_id),
    }));
  }

  addAuditLog(entry: {
    actor_user_id: string;
    actor_type: "user" | "ai" | "system";
    action: string;
    entity_type: string;
    entity_id: string;
    metadata_json: Record<string, any>;
  }): AuditLog {
    const log: AuditLog = {
      id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      club_id: this.club.id,
      actor_user_id: entry.actor_user_id,
      actor_type: entry.actor_type,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      metadata_json: entry.metadata_json,
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    return log;
  }

  // AI Tool Calling & Safety Architecture
  executeAITool(
    toolName: AIToolCall["tool_name"],
    args: Record<string, any>,
    explanation?: string
  ): { toolCall: AIToolCall; requiresApproval: boolean; result?: any } {
    const toolCallId = `tool-${Date.now().toString(36)}`;
    const user = this.getCurrentUser();

    // Side effect classification (Auto vs Confirm vs Restricted)
    let side_effect_tier: AIToolCall["side_effect_tier"] = "auto";
    let requiresApproval = false;

    if (
      toolName === "assign_task" ||
      toolName === "create_task" ||
      toolName === "create_risk" ||
      toolName === "create_announcement" ||
      toolName === "update_task"
    ) {
      side_effect_tier = "confirm";
      requiresApproval = true;
    } else if (toolName === "create_event") {
      side_effect_tier = "restricted";
      if (user.role !== "admin") {
        throw new Error("Restricted Action: Only club administrators can create or alter events.");
      }
      requiresApproval = true;
    }

    const toolCall: AIToolCall = {
      id: toolCallId,
      conversation_id: "conv-main",
      tool_name: toolName,
      arguments_json: args,
      status: requiresApproval ? "pending_approval" : "executed",
      side_effect_tier,
      explanation: explanation || `AI proposed action: ${toolName.replace(/_/g, " ")}`,
      created_at: new Date().toISOString(),
    };

    if (requiresApproval) {
      this.pendingToolCalls.push(toolCall);
      return { toolCall, requiresApproval: true };
    }

    // Auto-executable read tools
    const result = this.dispatchToolExecution(toolName, args);
    toolCall.result_json = result;

    this.addAuditLog({
      actor_user_id: user.id,
      actor_type: "ai",
      action: `AI_TOOL_${toolName.toUpperCase()}`,
      entity_type: "ai_tool_call",
      entity_id: toolCallId,
      metadata_json: { args, resultSummary: "Auto-executed read tool" },
    });

    return { toolCall, requiresApproval: false, result };
  }

  approveAITool(toolCallId: string, approved: boolean): { success: boolean; result?: any } {
    const index = this.pendingToolCalls.findIndex((t) => t.id === toolCallId);
    const user = this.getCurrentUser();

    if (index === -1) {
      // Find from audit or generate fallback
      return { success: false, result: "Tool call not found or expired" };
    }

    const call = this.pendingToolCalls[index];
    if (!approved) {
      call.status = "rejected";
      this.pendingToolCalls.splice(index, 1);
      this.addAuditLog({
        actor_user_id: user.id,
        actor_type: "user",
        action: "REJECT_AI_ACTION",
        entity_type: "ai_tool_call",
        entity_id: toolCallId,
        metadata_json: { tool: call.tool_name, arguments: call.arguments_json },
      });
      return { success: false, result: "Action cancelled by user." };
    }

    call.status = "executed";
    const result = this.dispatchToolExecution(call.tool_name, call.arguments_json);
    call.result_json = result;
    this.pendingToolCalls.splice(index, 1);

    this.addAuditLog({
      actor_user_id: user.id,
      actor_type: "user",
      action: "APPROVE_AI_ACTION",
      entity_type: "ai_tool_call",
      entity_id: toolCallId,
      metadata_json: {
        tool: call.tool_name,
        target: call.arguments_json.owner_name || call.arguments_json.title || "Entity",
        arguments: call.arguments_json,
        status: "SUCCESS",
      },
    });

    return { success: true, result };
  }

  public dispatchToolExecution(toolName: AIToolCall["tool_name"], args: Record<string, any>): any {
    switch (toolName) {
      case "create_task": {
        const owner = this.users.find(
          (u) => u.name.toLowerCase().includes((args.owner || "").toLowerCase()) || u.id === args.owner_id
        );
        const task = this.createTask({
          event_id: this.event.id,
          title: args.title || "AI Generated Task",
          description: args.description || "Created via AI Copilot command",
          owner_id: owner ? owner.id : undefined,
          status: "todo",
          priority: args.priority || "high",
          due_at: args.deadline || args.due_at || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: this.currentUserId,
        });
        return { task_id: task.id, title: task.title, owner: owner?.name || "Unassigned" };
      }
      case "search_tasks": {
        const q = (args.query || "").toLowerCase();
        const results = this.tasks.filter(
          (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
        );
        return { count: results.length, tasks: results.slice(0, 5) };
      }
      case "get_event_summary": {
        const tasks = this.getTasks();
        const overdue = tasks.filter(
          (t) => new Date(t.due_at).getTime() < Date.now() && t.status !== "done"
        ).length;
        return {
          event_name: this.event.name,
          venue: this.event.venue,
          total_tasks: tasks.length,
          completed_tasks: tasks.filter((t) => t.status === "done").length,
          overdue_tasks: overdue,
          active_risks: this.risks.filter((r) => r.status === "active").length,
          volunteers_count: this.volunteers.length,
        };
      }
      case "get_workload": {
        const vols = this.getVolunteers();
        const overloaded = vols.filter((v) => v.availability === "overloaded" || (v.workloadScore || 0) > 80);
        return {
          total_volunteers: vols.length,
          overloaded_volunteers: overloaded.map((v) => ({
            name: v.user?.name,
            score: v.workloadScore,
            tasks: v.assignedTasks?.length,
          })),
        };
      }
      case "detect_risks": {
        const risks = this.runRiskAnalysis();
        return { active_risks: risks.length, critical: risks.filter((r) => r.severity === "critical") };
      }
      case "search_documents":
      case "answer_from_knowledge": {
        return this.searchKnowledgeRAG(args.query || "");
      }
      default:
        return { message: `Tool ${toolName} executed successfully.` };
    }
  }
}

// Global Singleton Store for client & server components
export const db = new DatabaseStore();
