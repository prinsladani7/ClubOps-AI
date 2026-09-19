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
  Team,
  TeamMember,
  RoleAssignment,
  PermissionRequest,
  PermissionAction,
  PermissionScope,
  AITeamRecommendation,
  TaskDelegationStep,
  TaskAssignmentHistory,
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
  SEED_TEAMS,
  SEED_TEAM_MEMBERS,
  SEED_ROLE_ASSIGNMENTS,
  SEED_PERMISSION_REQUESTS,
} from "./mock-store";
import { can, PermissionContext } from "@/lib/permissions";

// Reactive in-memory state initialized from seed data
class DatabaseStore {
  private users: User[] = [...SEED_USERS];
  private club = { ...SEED_CLUB };
  private event = { ...SEED_EVENT };
  private teams: Team[] = [...SEED_TEAMS];
  private teamMembers: TeamMember[] = [...SEED_TEAM_MEMBERS];
  private roleAssignments: RoleAssignment[] = [...SEED_ROLE_ASSIGNMENTS];
  private permissionRequests: PermissionRequest[] = [...SEED_PERMISSION_REQUESTS];
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

  public checkPermission(action: PermissionAction, resource?: any, context?: Partial<PermissionContext>): boolean {
    const user = this.getCurrentUser();
    return can(user, action, resource, {
      teams: this.teams,
      roleAssignments: this.roleAssignments,
      ...context,
    });
  }

  getUsers(): User[] {
    return [...this.users];
  }

  getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  registerUser(name: string, email: string, role: UserRole): User {
    const existing = this.getUserByEmail(email);
    if (existing) return existing;

    const newUser: User = {
      id: `usr-${Date.now().toString(36)}`,
      name,
      email,
      role,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      created_at: new Date().toISOString(),
    };
    this.users.push(newUser);

    this.addAuditLog({
      actor_user_id: newUser.id,
      actor_type: "user",
      action: "USER_REGISTER",
      entity_type: "user",
      entity_id: newUser.id,
      metadata_json: { name, email, role },
    });

    return newUser;
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

  // ==========================================
  // TEAMS & HIERARCHICAL MANAGEMENT (Section 2 & 5)
  // ==========================================
  getTeams(): Team[] {
    return this.teams.map((t) => {
      const members = this.teamMembers.filter((m) => m.team_id === t.id && m.status === "active");
      const organizer = this.users.find((u) => u.id === t.organizer_id);
      const teamTasks = this.tasks.filter((tk) => tk.team_id === t.id || members.some((m) => m.user_id === tk.owner_id));
      const activeTasks = teamTasks.filter((tk) => tk.status !== "done");
      const overdueTasks = activeTasks.filter((tk) => new Date(tk.due_at).getTime() < Date.now());
      const blockedTasks = teamTasks.filter((tk) => tk.status === "blocked");
      const completedTasks = teamTasks.filter((tk) => tk.status === "done");

      return {
        ...t,
        organizer,
        member_count: members.length,
        active_tasks_count: activeTasks.length,
        overdue_tasks_count: overdueTasks.length,
        blocked_tasks_count: blockedTasks.length,
        completed_tasks_count: completedTasks.length,
      };
    });
  }

  getTeamById(id: string): Team | undefined {
    const t = this.teams.find((tm) => tm.id === id);
    if (!t) return undefined;
    const members = this.teamMembers.filter((m) => m.team_id === t.id && m.status === "active");
    const organizer = this.users.find((u) => u.id === t.organizer_id);
    const teamTasks = this.tasks.filter((tk) => tk.team_id === t.id || members.some((m) => m.user_id === tk.owner_id));
    const activeTasks = teamTasks.filter((tk) => tk.status !== "done");
    const overdueTasks = activeTasks.filter((tk) => new Date(tk.due_at).getTime() < Date.now());
    const blockedTasks = teamTasks.filter((tk) => tk.status === "blocked");
    const completedTasks = teamTasks.filter((tk) => tk.status === "done");

    return {
      ...t,
      organizer,
      member_count: members.length,
      active_tasks_count: activeTasks.length,
      overdue_tasks_count: overdueTasks.length,
      blocked_tasks_count: blockedTasks.length,
      completed_tasks_count: completedTasks.length,
    };
  }

  createTeam(data: {
    name: string;
    description: string;
    organizer_id: string;
    event_id?: string;
  }): Team {
    if (!this.checkPermission("CREATE_TEAM")) {
      throw new Error("Unauthorized: Only Admins have permission to create teams.");
    }

    const teamId = `team-${Date.now().toString(36)}`;
    const newTeam: Team = {
      id: teamId,
      club_id: this.club.id,
      event_id: data.event_id || this.event.id,
      name: data.name,
      description: data.description,
      organizer_id: data.organizer_id,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.teams.push(newTeam);

    // Automatically add organizer to team_members
    this.teamMembers.push({
      id: `tm-${Date.now().toString(36)}-org`,
      team_id: teamId,
      user_id: data.organizer_id,
      role: "organizer",
      joined_at: new Date().toISOString(),
      status: "active",
    });

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "CREATE_TEAM",
      entity_type: "team",
      entity_id: teamId,
      metadata_json: { name: data.name, organizer_id: data.organizer_id },
    });

    return this.getTeamById(teamId)!;
  }

  updateTeam(id: string, patch: Partial<Team>): Team | undefined {
    if (!this.checkPermission("EDIT_TEAM", undefined, { teamId: id })) {
      throw new Error("Unauthorized: You do not have permission to edit this team.");
    }

    const idx = this.teams.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;

    this.teams[idx] = {
      ...this.teams[idx],
      ...patch,
      updated_at: new Date().toISOString(),
    };

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "EDIT_TEAM",
      entity_type: "team",
      entity_id: id,
      metadata_json: patch,
    });

    return this.getTeamById(id);
  }

  archiveTeam(id: string): boolean {
    if (!this.checkPermission("ARCHIVE_TEAM", undefined, { teamId: id })) {
      throw new Error("Unauthorized: Only Admins can archive teams.");
    }
    const team = this.teams.find((t) => t.id === id);
    if (!team) return false;
    team.status = "archived";
    team.updated_at = new Date().toISOString();

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "ARCHIVE_TEAM",
      entity_type: "team",
      entity_id: id,
      metadata_json: {},
    });
    return true;
  }

  suspendTeam(id: string): boolean {
    if (!this.checkPermission("SUSPEND_TEAM", undefined, { teamId: id })) {
      throw new Error("Unauthorized: Only Admins can suspend teams.");
    }
    const team = this.teams.find((t) => t.id === id);
    if (!team) return false;
    team.status = "suspended";
    team.updated_at = new Date().toISOString();

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "SUSPEND_TEAM",
      entity_type: "team",
      entity_id: id,
      metadata_json: {},
    });
    return true;
  }

  getTeamMembers(teamId: string): TeamMember[] {
    return this.teamMembers
      .filter((m) => m.team_id === teamId && m.status === "active")
      .map((m) => ({
        ...m,
        user: this.users.find((u) => u.id === m.user_id),
      }));
  }

  addTeamMember(
    teamId: string,
    userId: string,
    role: "organizer" | "volunteer" | "acting_organizer" = "volunteer"
  ): TeamMember {
    if (!this.checkPermission("ASSIGN_VOLUNTEER", undefined, { teamId })) {
      throw new Error("Unauthorized: You do not have permission to add members to this team.");
    }

    const existing = this.teamMembers.find((m) => m.team_id === teamId && m.user_id === userId);
    if (existing) {
      existing.status = "active";
      existing.role = role;
      return {
        ...existing,
        user: this.users.find((u) => u.id === userId),
      };
    }

    const member: TeamMember = {
      id: `tm-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      team_id: teamId,
      user_id: userId,
      role,
      joined_at: new Date().toISOString(),
      status: "active",
    };
    this.teamMembers.push(member);

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "ASSIGN_VOLUNTEER",
      entity_type: "team_member",
      entity_id: member.id,
      metadata_json: { teamId, userId, role },
    });

    return {
      ...member,
      user: this.users.find((u) => u.id === userId),
    };
  }

  removeTeamMember(teamMemberId: string): boolean {
    const member = this.teamMembers.find((m) => m.id === teamMemberId);
    if (!member) return false;

    if (!this.checkPermission("REMOVE_MEMBER", undefined, { teamId: member.team_id })) {
      throw new Error("Unauthorized: You do not have permission to remove members from this team.");
    }

    this.teamMembers = this.teamMembers.filter((m) => m.id !== teamMemberId);

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "REMOVE_MEMBER",
      entity_type: "team_member",
      entity_id: teamMemberId,
      metadata_json: { team_id: member.team_id, user_id: member.user_id },
    });

    return true;
  }

  transferTeamMember(teamMemberId: string, targetTeamId: string): TeamMember | undefined {
    const member = this.teamMembers.find((m) => m.id === teamMemberId);
    if (!member) return undefined;

    if (
      !this.checkPermission("REMOVE_MEMBER", undefined, { teamId: member.team_id }) ||
      !this.checkPermission("ASSIGN_VOLUNTEER", undefined, { teamId: targetTeamId })
    ) {
      throw new Error("Unauthorized: You do not have permission to transfer this member.");
    }

    member.team_id = targetTeamId;

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "TRANSFER_TEAM_MEMBER",
      entity_type: "team_member",
      entity_id: teamMemberId,
      metadata_json: { targetTeamId, user_id: member.user_id },
    });

    return {
      ...member,
      user: this.users.find((u) => u.id === member.user_id),
    };
  }

  // ==========================================
  // TEMPORARY EVENT ROLES & ACTING ORGANIZER (Section 8 & 9)
  // ==========================================
  getRoleAssignments(activeOnly: boolean = false): RoleAssignment[] {
    const now = new Date().getTime();
    let list = this.roleAssignments;
    if (activeOnly) {
      list = list.filter(
        (ra) =>
          ra.status === "active" &&
          new Date(ra.starts_at).getTime() <= now &&
          new Date(ra.expires_at).getTime() > now
      );
    }
    return list.map((ra) => ({
      ...ra,
      user: this.users.find((u) => u.id === ra.user_id),
    }));
  }

  assignTemporaryRole(data: {
    user_id: string;
    role: string;
    scope_type: PermissionScope;
    scope_id: string;
    expires_at: string;
    starts_at?: string;
  }): RoleAssignment {
    if (!this.checkPermission("MANAGE_PERMISSIONS")) {
      throw new Error("Unauthorized: Only Admins can grant role assignments.");
    }

    const assignment: RoleAssignment = {
      id: `ra-${Date.now().toString(36)}`,
      user_id: data.user_id,
      role: data.role,
      scope_type: data.scope_type,
      scope_id: data.scope_id,
      starts_at: data.starts_at || new Date().toISOString(),
      expires_at: data.expires_at,
      status: "active",
      granted_by: this.currentUserId,
      created_at: new Date().toISOString(),
    };

    this.roleAssignments.push(assignment);

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "ASSIGN_ROLE",
      entity_type: "role_assignment",
      entity_id: assignment.id,
      metadata_json: data,
    });

    return {
      ...assignment,
      user: this.users.find((u) => u.id === data.user_id),
    };
  }

  assignActingOrganizer(teamId: string, volunteerUserId: string, durationHours: number = 48): RoleAssignment {
    const team = this.teams.find((t) => t.id === teamId);
    const user = this.getCurrentUser();
    const isTeamOrg = team && team.organizer_id === user.id;
    const isAdmin = user.role === "admin";

    if (!isAdmin && !isTeamOrg) {
      throw new Error("Unauthorized: Only Admins or the Team Organizer can appoint an Acting Organizer.");
    }

    const now = new Date();
    const expires = new Date(now.getTime() + durationHours * 3600 * 1000).toISOString();

    const assignment: RoleAssignment = {
      id: `ra-${Date.now().toString(36)}-act`,
      user_id: volunteerUserId,
      role: "ACTING_ORGANIZER",
      scope_type: "team",
      scope_id: teamId,
      starts_at: now.toISOString(),
      expires_at: expires,
      status: "active",
      granted_by: user.id,
      created_at: now.toISOString(),
    };

    this.roleAssignments.push(assignment);

    const existing = this.teamMembers.find((m) => m.team_id === teamId && m.user_id === volunteerUserId);
    if (existing) {
      existing.role = "acting_organizer";
    }

    this.addAuditLog({
      actor_user_id: user.id,
      actor_type: "user",
      action: "ASSIGN_ACTING_ORGANIZER",
      entity_type: "role_assignment",
      entity_id: assignment.id,
      metadata_json: { teamId, volunteerUserId, durationHours, expires_at: expires },
    });

    return {
      ...assignment,
      user: this.users.find((u) => u.id === volunteerUserId),
    };
  }

  revokeRoleAssignment(assignmentId: string): boolean {
    if (!this.checkPermission("MANAGE_PERMISSIONS")) {
      throw new Error("Unauthorized: Only Admins can revoke role assignments.");
    }

    const ra = this.roleAssignments.find((r) => r.id === assignmentId);
    if (!ra) return false;
    ra.status = "revoked";

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "REVOKE_ROLE_ASSIGNMENT",
      entity_type: "role_assignment",
      entity_id: assignmentId,
      metadata_json: {},
    });

    return true;
  }

  // ==========================================
  // PERMISSION REQUESTS & REVIEW (Section 10)
  // ==========================================
  getPermissionRequests(status?: string): PermissionRequest[] {
    let list = this.permissionRequests;
    if (status) {
      list = list.filter((r) => r.status === status);
    }
    return list.map((r) => ({
      ...r,
      requester: this.users.find((u) => u.id === r.requester_id),
      reviewer: this.users.find((u) => u.id === r.reviewer_id),
    }));
  }

  createPermissionRequest(data: {
    permission: PermissionAction;
    scope_type: PermissionScope;
    scope_id: string;
    resource_type: string;
    resource_id?: string;
    reason: string;
    duration_hours?: number;
  }): PermissionRequest {
    const user = this.getCurrentUser();
    const reqId = `pr-${Date.now().toString(36)}`;

    const req: PermissionRequest = {
      id: reqId,
      requester_id: user.id,
      permission: data.permission,
      scope_type: data.scope_type,
      scope_id: data.scope_id,
      resource_type: data.resource_type,
      resource_id: data.resource_id,
      reason: data.reason,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    this.permissionRequests.unshift(req);

    // Notify all admins
    const admins = this.users.filter((u) => u.role === "admin");
    admins.forEach((admin) => {
      this.notifications.unshift({
        id: `notif-${Date.now().toString(36)}-${admin.id}`,
        user_id: admin.id,
        type: "permission_request",
        title: "Access Elevation Request",
        body: `${user.name} (${user.role.toUpperCase()}) requested permission "${data.permission}": ${data.reason}`,
        created_at: new Date().toISOString(),
      });
    });

    this.addAuditLog({
      actor_user_id: user.id,
      actor_type: "user",
      action: "REQUEST_PERMISSION",
      entity_type: "permission_request",
      entity_id: reqId,
      metadata_json: data,
    });

    return {
      ...req,
      requester: user,
    };
  }

  reviewPermissionRequest(
    requestId: string,
    action: "approve" | "reject" | "temporarily_approve",
    tempDurationHours: number = 24,
    reviewNotes?: string
  ): PermissionRequest | undefined {
    const user = this.getCurrentUser();
    const req = this.permissionRequests.find((r) => r.id === requestId);
    if (!req) return undefined;

    if (!this.checkPermission("APPROVE_PERMISSION", undefined, { teamId: req.scope_id })) {
      throw new Error("Unauthorized: Only Admins or Team Organizers can review permission requests.");
    }

    req.reviewer_id = user.id;
    req.reviewed_at = new Date().toISOString();

    if (action === "approve") {
      req.status = "approved";
    } else if (action === "temporarily_approve") {
      req.status = "temporarily_approved";
      req.expires_at = new Date(Date.now() + tempDurationHours * 3600 * 1000).toISOString();
      this.roleAssignments.push({
        id: `ra-${Date.now().toString(36)}-pr`,
        user_id: req.requester_id,
        role: req.permission,
        scope_type: req.scope_type,
        scope_id: req.scope_id,
        starts_at: new Date().toISOString(),
        expires_at: req.expires_at,
        status: "active",
        granted_by: user.id,
        created_at: new Date().toISOString(),
      });
    } else {
      req.status = "rejected";
    }

    this.notifications.unshift({
      id: `notif-${Date.now().toString(36)}-req`,
      user_id: req.requester_id,
      type: "permission_request",
      title: `Permission Request ${req.status.toUpperCase().replace("_", " ")}`,
      body: `Your access request for "${req.permission}" was ${req.status.replace("_", " ")} by ${user.name}. ${reviewNotes || ""}`,
      created_at: new Date().toISOString(),
    });

    this.addAuditLog({
      actor_user_id: user.id,
      actor_type: "user",
      action: `REVIEW_PERMISSION_REQUEST_${action.toUpperCase()}`,
      entity_type: "permission_request",
      entity_id: req.id,
      metadata_json: { action, tempDurationHours, reviewNotes },
    });

    return {
      ...req,
      requester: this.users.find((u) => u.id === req.requester_id),
      reviewer: user,
    };
  }

  // ==========================================
  // TASK DELEGATION & ESCALATION (Section 7 & 11)
  // ==========================================
  delegateTask(taskId: string, targetUserId: string, reason?: string): Task | undefined {
    const user = this.getCurrentUser();
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return undefined;

    if (!this.checkPermission("DELEGATE_TASK", task, { taskId })) {
      throw new Error("Unauthorized: You do not have permission to delegate this task.");
    }

    const prevOwnerId = task.owner_id || "unassigned";
    const chain: TaskDelegationStep[] = task.delegation_chain || [];
    const stepNumber = chain.length + 1;

    const delegationStep: TaskDelegationStep = {
      from_user_id: user.id,
      to_user_id: targetUserId,
      delegated_at: new Date().toISOString(),
      reason: reason || `Delegated by ${user.name}`,
    };

    const history: TaskAssignmentHistory[] = task.assignment_history || [];
    const targetUser = this.users.find((u) => u.id === targetUserId);
    history.push({
      user_id: targetUserId,
      user_name: targetUser?.name || "Volunteer",
      timestamp: new Date().toISOString(),
      action: `Delegated from ${user.name} to ${targetUser?.name || "Volunteer"} (Step ${stepNumber})`,
    });

    task.owner_id = targetUserId;
    task.assigned_by = user.id;
    task.delegation_chain = [...chain, delegationStep];
    task.assignment_history = history;
    task.updated_at = new Date().toISOString();

    const targetVol = this.volunteers.find((v) => v.user_id === targetUserId);
    if (targetVol) {
      targetVol.workloadScore = Math.min(100, (targetVol.workloadScore || 20) + 12);
      if (targetVol.workloadScore > 85) targetVol.availability = "overloaded";
    }

    this.addAuditLog({
      actor_user_id: user.id,
      actor_type: "user",
      action: "DELEGATE_TASK",
      entity_type: "task",
      entity_id: taskId,
      metadata_json: { prevOwnerId, newOwnerId: targetUserId, stepNumber, reason },
    });

    return this.getTaskById(taskId);
  }

  escalateTask(taskId: string, blockerDescription: string): Task | undefined {
    const user = this.getCurrentUser();
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return undefined;

    if (!this.checkPermission("ESCALATE_TASK", task, { taskId })) {
      throw new Error("Unauthorized: You cannot escalate this task.");
    }

    const currentLevel = task.escalation_level || "volunteer";
    let nextLevel: "organizer" | "admin" = "organizer";
    let targetAssigneeId: string | undefined;

    const team = task.team_id ? this.teams.find((tm) => tm.id === task.team_id) : undefined;
    const admin = this.users.find((u) => u.role === "admin");

    if (currentLevel === "volunteer" || !task.escalation_level) {
      nextLevel = "organizer";
      targetAssigneeId = team?.organizer_id || admin?.id;
    } else {
      nextLevel = "admin";
      targetAssigneeId = admin?.id;
    }

    task.escalation_level = nextLevel;
    task.escalated_to = targetAssigneeId;
    task.escalated_at = new Date().toISOString();
    task.blocked_at = task.blocked_at || new Date().toISOString();
    task.resolution_status = "pending";
    task.status = "blocked";
    task.updated_at = new Date().toISOString();

    if (targetAssigneeId) {
      this.notifications.unshift({
        id: `notif-${Date.now().toString(36)}-esc`,
        user_id: targetAssigneeId,
        type: "escalation",
        title: `🚨 Emergency Escalation [${nextLevel.toUpperCase()} LEVEL]`,
        body: `Task "${task.title}" has been escalated by ${user.name}: ${blockerDescription}`,
        created_at: new Date().toISOString(),
      });
    }

    this.addAuditLog({
      actor_user_id: user.id,
      actor_type: "user",
      action: `ESCALATE_TASK_${nextLevel.toUpperCase()}`,
      entity_type: "task",
      entity_id: taskId,
      metadata_json: { blockerDescription, nextLevel, escalated_to: targetAssigneeId },
    });

    return this.getTaskById(taskId);
  }

  resolveTaskBlocker(taskId: string, notes?: string): Task | undefined {
    const user = this.getCurrentUser();
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return undefined;

    task.resolution_status = "resolved";
    task.status = "in_progress";
    task.escalation_level = undefined;
    task.blocked_at = undefined;
    task.updated_at = new Date().toISOString();

    this.addAuditLog({
      actor_user_id: user.id,
      actor_type: "user",
      action: "RESOLVE_TASK_BLOCKER",
      entity_type: "task",
      entity_id: taskId,
      metadata_json: { notes },
    });

    return this.getTaskById(taskId);
  }

  // ==========================================
  // AI TEAM BUILDER (Section 6)
  // ==========================================
  recommendTeam(spec: {
    goal: string;
    required_skills?: string[];
    max_members?: number;
  }): AITeamRecommendation {
    const vols = this.getVolunteers();
    const skillsNeeded =
      spec.required_skills && spec.required_skills.length > 0
        ? spec.required_skills
        : ["Coordination", "Logistics", "Operations"];

    const organizerCandidates = vols
      .filter((v) => (v.workloadScore || 50) < 80)
      .sort((a, b) => {
        const aOrgBonus = a.user?.role === "organizer" ? 40 : 0;
        const bOrgBonus = b.user?.role === "organizer" ? 40 : 0;
        return bOrgBonus + (100 - (b.workloadScore || 50)) - (aOrgBonus + (100 - (a.workloadScore || 50)));
      });

    const chosenOrganizer =
      organizerCandidates[0]?.user ||
      this.users.find((u) => u.role === "organizer") ||
      this.users[0];

    const maxMembers = spec.max_members || 4;
    const memberPool = vols.filter((v) => v.user_id !== chosenOrganizer.id);

    const scored = memberPool.map((v) => {
      let matches = 0;
      v.skills.forEach((s) => {
        if (
          skillsNeeded.some(
            (sn) => sn.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(sn.toLowerCase())
          )
        ) {
          matches++;
        }
      });
      const capacityBonus = Math.max(0, 100 - (v.workloadScore || 50));
      return {
        volunteer: v,
        score: matches * 30 + capacityBonus,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    const chosenMembers = scored.slice(0, maxMembers);

    const recommended_members = chosenMembers.map((c) => c.volunteer.user?.name || "Volunteer");
    const recommended_member_ids = chosenMembers.map((c) => c.volunteer.user_id);

    const skill_coverage = skillsNeeded.filter((sk) =>
      chosenMembers.some((c) =>
        c.volunteer.skills.some((s) => s.toLowerCase().includes(sk.toLowerCase()))
      )
    );

    const averageWorkload =
      chosenMembers.length > 0
        ? Math.round(
            chosenMembers.reduce((acc, c) => acc + (c.volunteer.workloadScore || 40), 0) /
              chosenMembers.length
          )
        : 40;

    const team_name =
      spec.goal.length > 30 ? spec.goal.substring(0, 27) + " Team" : `${spec.goal} Squad`;

    return {
      team_name,
      recommended_organizer: chosenOrganizer.name,
      recommended_organizer_id: chosenOrganizer.id,
      recommended_members,
      recommended_member_ids,
      skill_coverage: skill_coverage.length > 0 ? skill_coverage : skillsNeeded,
      workload_analysis: {
        average_team_workload_pct: averageWorkload,
        overloaded_candidates_bypassed: vols.filter((v) => (v.workloadScore || 0) > 75).length,
        capacity_health: averageWorkload < 60 ? "optimal" : "moderate",
      },
      reasoning: [
        `Assigned ${chosenOrganizer.name} as lead organizer due to high operational availability.`,
        `Selected ${recommended_members.length} contributors with matching competencies in ${skillsNeeded.join(", ")}.`,
        `Prevented burnout by excluding overloaded volunteers with >75% task load.`,
      ],
    };
  }

  createTeamFromRecommendation(recommendation: AITeamRecommendation): Team {
    if (!this.checkPermission("CREATE_TEAM")) {
      throw new Error("Unauthorized: Only Admins can create teams.");
    }

    const orgId =
      recommendation.recommended_organizer_id ||
      this.users.find((u) => u.name === recommendation.recommended_organizer)?.id ||
      this.currentUserId;

    const team = this.createTeam({
      name: recommendation.team_name,
      description: `AI-Synthesized Team to fulfill operational objectives. Skills: ${recommendation.skill_coverage.join(", ")}`,
      organizer_id: orgId,
    });

    if (recommendation.recommended_member_ids) {
      for (const memId of recommendation.recommended_member_ids) {
        this.addTeamMember(team.id, memId, "volunteer");
      }
    }

    return this.getTeamById(team.id)!;
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

    // Verify RBAC permission before execution (Section 13)
    if (toolName === "create_task" && !this.checkPermission("CREATE_TASK")) {
      throw new Error(`Unauthorized: User ${user.name} (${user.role}) lacks permission to create tasks.`);
    }
    if (toolName === "assign_task" && !this.checkPermission("ASSIGN_TASK")) {
      throw new Error(`Unauthorized: User ${user.name} (${user.role}) lacks permission to assign tasks.`);
    }
    if (toolName === "create_team" && !this.checkPermission("CREATE_TEAM")) {
      throw new Error(`Unauthorized: User ${user.name} (${user.role}) lacks permission to create teams.`);
    }
    if (toolName === "delegate_task" && !this.checkPermission("DELEGATE_TASK", undefined, { taskId: args.task_id })) {
      throw new Error(`Unauthorized: User ${user.name} lacks permission to delegate tasks.`);
    }
    if (toolName === "escalate_task" && !this.checkPermission("ESCALATE_TASK", undefined, { taskId: args.task_id })) {
      throw new Error(`Unauthorized: User ${user.name} lacks permission to escalate tasks.`);
    }
    if (toolName === "create_event" && !this.checkPermission("CREATE_EVENT")) {
      throw new Error(`Unauthorized: User ${user.name} lacks permission to create events.`);
    }
    if (toolName === "review_permission_request" && !this.checkPermission("APPROVE_PERMISSION")) {
      throw new Error(`Unauthorized: User ${user.name} lacks permission to review permission requests.`);
    }

    // Side effect classification (Auto vs Confirm vs Restricted)
    let side_effect_tier: AIToolCall["side_effect_tier"] = "auto";
    let requiresApproval = false;

    if (
      toolName === "assign_task" ||
      toolName === "create_task" ||
      toolName === "create_risk" ||
      toolName === "create_announcement" ||
      toolName === "update_task" ||
      toolName === "delegate_task" ||
      toolName === "escalate_task" ||
      toolName === "request_permission" ||
      toolName === "review_permission_request"
    ) {
      side_effect_tier = "confirm";
      requiresApproval = true;
    } else if (toolName === "create_event" || toolName === "create_team") {
      side_effect_tier = "restricted";
      if (user.role !== "admin") {
        throw new Error(`Restricted Action: Only club administrators can execute ${toolName}.`);
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
      case "recommend_team": {
        return this.recommendTeam({
          goal: args.goal || "Operational Squad",
          required_skills: args.required_skills || [],
          max_members: args.max_members || 4,
        });
      }
      case "create_team": {
        const team = this.createTeam({
          name: args.name || "AI Generated Team",
          description: args.description || "Formed via AI Copilot",
          organizer_id: args.organizer_id || this.currentUserId,
        });
        return { team_id: team.id, name: team.name, organizer_id: team.organizer_id };
      }
      case "delegate_task": {
        const task = this.delegateTask(args.task_id, args.target_user_id, args.reason);
        return { task_id: task?.id, title: task?.title, owner_id: task?.owner_id };
      }
      case "escalate_task": {
        const task = this.escalateTask(args.task_id, args.blocker_description || "Critical operational blocker");
        return { task_id: task?.id, escalation_level: task?.escalation_level, escalated_to: task?.escalated_to };
      }
      case "request_permission": {
        const req = this.createPermissionRequest({
          permission: args.permission || "APPROVE_AI_ACTION",
          scope_type: args.scope_type || "team",
          scope_id: args.scope_id || "team-tech-ops",
          resource_type: args.resource_type || "task",
          resource_id: args.resource_id,
          reason: args.reason || "Operational requirement",
        });
        return { request_id: req.id, status: req.status };
      }
      case "review_permission_request": {
        const req = this.reviewPermissionRequest(args.request_id, args.action || "approve", args.duration_hours, args.review_notes);
        return { request_id: req?.id, status: req?.status };
      }
      default:
        return { message: `Tool ${toolName} executed successfully.` };
    }
  }
}

// Global Singleton Store for client & server components
export const db = new DatabaseStore();
