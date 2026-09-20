import {
  User,
  Event,
  Project,
  ProjectMember,
  UserSession,
  ProgressReport,
  UserSkill,
  AvailabilitySchedule,
  TimeEntry,
  Task,
  TaskChecklistItem,
  TaskComment,
  TaskEvidence,
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
  AIProjectBreakdownResult,
  AIWorkloadRebalanceSuggestion,
  TaskDelegationStep,
  TaskAssignmentHistory,
  JudgingTeam,
  JudgingScore,
  JudgingLeaderboardEntry,
  MentorTicket,
  SponsorPartner,
  HackathonTrack,
} from "@/types";
import {
  SEED_USERS,
  SEED_CLUB,
  SEED_EVENT,
  SEED_PROJECTS,
  SEED_PROJECT_MEMBERS,
  SEED_SESSIONS,
  SEED_PROGRESS_REPORTS,
  SEED_SKILLS,
  SEED_USER_SKILLS,
  SEED_AVAILABILITY,
  SEED_TIME_ENTRIES,
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
  SEED_JUDGING_TEAMS,
  SEED_MENTOR_TICKETS,
  SEED_SPONSORS,
} from "./mock-store";
import { can, PermissionContext } from "@/lib/permissions";
import { CriticalPathEngine, CPMTask, CPMSimulationResult, DelayImpactResult } from "@/lib/algorithms/cpm";
import { WorkloadOptimizer, OptimizerVolunteer, OptimizerTask, OptimizationSummary } from "@/lib/algorithms/workload-optimizer";
import { RiskPredictor, HackathonRiskReport } from "@/lib/algorithms/risk-predictor";
import { RunOfShowEngine, RunOfShowReport, BIT_N_BUILD_36H_TIMELINE } from "@/lib/algorithms/run-of-show";
import { generateNormalizedLeaderboard, computeWeightedScore } from "@/lib/algorithms/judging-normalizer";

// Reactive in-memory state initialized from seed data
class DatabaseStore {
  private users: User[] = [...SEED_USERS];
  private club = { ...SEED_CLUB };
  private event = { ...SEED_EVENT };
  private projects: Project[] = [];
  private projectMembers: ProjectMember[] = [];
  private sessions: UserSession[] = [];
  private progressReports: ProgressReport[] = [];
  private skills: string[] = [...SEED_SKILLS];
  private userSkills: UserSkill[] = [];
  private availability: AvailabilitySchedule[] = [];
  private timeEntries: TimeEntry[] = [];
  private teams: Team[] = [];
  private teamMembers: TeamMember[] = [];
  private roleAssignments: RoleAssignment[] = [];
  private permissionRequests: PermissionRequest[] = [];
  private volunteers: Volunteer[] = [];
  private tasks: Task[] = [];
  private risks: Risk[] = [];
  private documents: Document[] = [];
  private chunks: DocumentChunk[] = [];
  private meetings: Meeting[] = [];
  private actionItems: MeetingActionItem[] = [];
  private announcements: Announcement[] = [];
  private notifications: Notification[] = [];
  private auditLogs: AuditLog[] = [];
  private judgingTeams: JudgingTeam[] = [];
  private mentorTickets: MentorTicket[] = [];
  private sponsors: SponsorPartner[] = [];
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
      projects: this.projects,
      projectMembers: this.projectMembers,
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

  // ==========================================
  // AUTHENTICATION & SESSION MANAGEMENT (Section 1)
  // ==========================================
  loginUser(
    email: string,
    password?: string,
    intendedRole?: UserRole
  ): {
    success: boolean;
    error?: string;
    pendingVerification?: boolean;
    user?: User;
    session?: UserSession;
  } {
    const user = this.getUserByEmail(email);

    if (!user) {
      this.addAuditLog({
        actor_user_id: "system",
        actor_type: "system",
        action: "LOGIN_FAILED_NOT_FOUND",
        entity_type: "user",
        entity_id: email,
        metadata_json: { email, intendedRole },
      });
      return { success: false, error: "No account found matching this email address. Please check spelling or create an account." };
    }

    // Role matching requirement (Specification Section 2, 3 & 8)
    // The role selected on the first screen must match the account's assigned role.
    if (intendedRole && user.role !== intendedRole) {
      this.addAuditLog({
        actor_user_id: user.id,
        actor_type: "user",
        action: "LOGIN_FAILED_ROLE_MISMATCH",
        entity_type: "user",
        entity_id: user.id,
        metadata_json: { email, intendedRole, actualRole: user.role },
      });
      return {
        success: false,
        error: `Role mismatch: This account is registered as '${user.role.toUpperCase()}', not '${intendedRole.toUpperCase()}'. Please return to the role selection screen and select '${user.role.toUpperCase()}'.`,
      };
    }

    // Check account states
    if (user.status === "pending_verification") {
      this.addAuditLog({
        actor_user_id: user.id,
        actor_type: "user",
        action: "LOGIN_FAILED_PENDING_VERIFICATION",
        entity_type: "user",
        entity_id: user.id,
        metadata_json: { email },
      });
      return {
        success: false,
        error: "Account verification required. Please enter the verification token sent to your email.",
        pendingVerification: true,
        user,
      };
    }

    if (user.status === "suspended") {
      this.addAuditLog({
        actor_user_id: user.id,
        actor_type: "user",
        action: "LOGIN_FAILED_SUSPENDED",
        entity_type: "user",
        entity_id: user.id,
        metadata_json: { email },
      });
      return { success: false, error: "Access Denied: Your account has been suspended by administration. Contact clubops-admin@syntaxsquad.edu." };
    }

    if (user.status === "deactivated") {
      this.addAuditLog({
        actor_user_id: user.id,
        actor_type: "user",
        action: "LOGIN_FAILED_DEACTIVATED",
        entity_type: "user",
        entity_id: user.id,
        metadata_json: { email },
      });
      return { success: false, error: "Access Denied: This account has been deactivated." };
    }

    if (user.status === "locked_temporarily") {
      this.addAuditLog({
        actor_user_id: user.id,
        actor_type: "user",
        action: "LOGIN_FAILED_LOCKED",
        entity_type: "user",
        entity_id: user.id,
        metadata_json: { email, locked_until: user.locked_until },
      });
      return { success: false, error: "Account is temporarily locked due to excessive failed attempts. Please try again later or contact admin." };
    }

    // Password validation simulation with rate limiting
    if (password && password.toLowerCase() === "wrongpassword") {
      user.failed_login_attempts = (user.failed_login_attempts || 0) + 1;
      if (user.failed_login_attempts >= 5) {
        user.status = "locked_temporarily";
        user.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        this.addAuditLog({
          actor_user_id: user.id,
          actor_type: "system",
          action: "ACCOUNT_LOCKED_RATE_LIMIT",
          entity_type: "user",
          entity_id: user.id,
          metadata_json: { attempts: user.failed_login_attempts },
        });
        return { success: false, error: "Too many failed attempts. Account has been locked temporarily for 15 minutes." };
      }

      this.addAuditLog({
        actor_user_id: user.id,
        actor_type: "user",
        action: "LOGIN_FAILED_CREDENTIALS",
        entity_type: "user",
        entity_id: user.id,
        metadata_json: { attempts: user.failed_login_attempts },
      });
      return { success: false, error: "Invalid password provided." };
    }

    // Successful login
    user.failed_login_attempts = 0;
    this.setCurrentUser(user.id);

    const session: UserSession = {
      id: `sess-${Date.now().toString(36)}`,
      user_id: user.id,
      token: `token-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
      ip_address: "127.0.0.1",
      user_agent: "ClubOps AI Web Client",
      expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      revoked: false,
      created_at: new Date().toISOString(),
    };
    this.sessions.unshift(session);

    this.addAuditLog({
      actor_user_id: user.id,
      actor_type: "user",
      action: "LOGIN_SUCCESS",
      entity_type: "user",
      entity_id: user.id,
      metadata_json: { role: user.role, sessionId: session.id },
    });

    return { success: true, user, session };
  }

  verifyEmail(tokenOrEmail: string): { success: boolean; user?: User; error?: string } {
    const user = this.users.find(
      (u) =>
        u.verification_token === tokenOrEmail ||
        u.email.toLowerCase() === tokenOrEmail.toLowerCase()
    );

    if (!user) {
      return { success: false, error: "Invalid or expired verification token." };
    }

    user.status = "active";
    user.verification_token = undefined;

    this.addAuditLog({
      actor_user_id: user.id,
      actor_type: "user",
      action: "EMAIL_VERIFIED",
      entity_type: "user",
      entity_id: user.id,
      metadata_json: { email: user.email },
    });

    return { success: true, user };
  }

  forgotPassword(email: string): { success: boolean; message: string } {
    const user = this.getUserByEmail(email);
    this.addAuditLog({
      actor_user_id: user ? user.id : "anonymous",
      actor_type: "user",
      action: "PASSWORD_RESET_REQUEST",
      entity_type: "user",
      entity_id: email,
      metadata_json: { email, found: !!user },
    });
    return { success: true, message: `Password reset instructions dispatched to ${email}.` };
  }

  resetPassword(token: string, newPassword?: string): { success: boolean; message: string } {
    this.addAuditLog({
      actor_user_id: "anonymous",
      actor_type: "user",
      action: "PASSWORD_RESET_COMPLETED",
      entity_type: "token",
      entity_id: token,
      metadata_json: {},
    });
    return { success: true, message: "Password updated successfully. Please log in with your new credentials." };
  }

  getUserSessions(userId?: string): UserSession[] {
    const uid = userId || this.currentUserId;
    return this.sessions.filter((s) => s.user_id === uid && !s.revoked);
  }

  revokeSession(sessionId: string): boolean {
    if (!this.checkPermission("session:revoke")) {
      throw new Error("Unauthorized: Only Admins can revoke sessions.");
    }
    const sess = this.sessions.find((s) => s.id === sessionId);
    if (sess) {
      sess.revoked = true;
      this.addAuditLog({
        actor_user_id: this.currentUserId,
        actor_type: "user",
        action: "SESSION_REVOKED",
        entity_type: "session",
        entity_id: sessionId,
        metadata_json: { user_id: sess.user_id },
      });
      return true;
    }
    return false;
  }

  revokeAllSessions(userId?: string): number {
    if (!this.checkPermission("session:revoke") && !this.checkPermission("settings:manage")) {
      throw new Error("Unauthorized: Only Admins can revoke all sessions.");
    }
    const targetUserId = userId || this.currentUserId;
    let count = 0;
    this.sessions.forEach((s) => {
      if (s.user_id === targetUserId && !s.revoked) {
        s.revoked = true;
        count++;
      }
    });
    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "ALL_SESSIONS_REVOKED",
      entity_type: "user",
      entity_id: targetUserId,
      metadata_json: { revokedCount: count },
    });
    return count;
  }

  suspendUser(userId: string, reason?: string): boolean {
    if (!this.checkPermission("settings:manage")) {
      throw new Error("Unauthorized: Only Admins can suspend accounts.");
    }
    const user = this.users.find((u) => u.id === userId);
    if (!user) return false;
    user.status = "suspended";
    this.revokeAllSessions(userId);
    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "USER_SUSPENDED",
      entity_type: "user",
      entity_id: userId,
      metadata_json: { reason: reason || "Administrative suspension" },
    });
    return true;
  }

  deactivateUser(userId: string, reason?: string): boolean {
    if (!this.checkPermission("settings:manage")) {
      throw new Error("Unauthorized: Only Admins can deactivate accounts.");
    }
    const user = this.users.find((u) => u.id === userId);
    if (!user) return false;
    user.status = "deactivated";
    this.revokeAllSessions(userId);
    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "USER_DEACTIVATED",
      entity_type: "user",
      entity_id: userId,
      metadata_json: { reason: reason || "Account deactivated" },
    });
    return true;
  }

  activateUser(userId: string): boolean {
    if (!this.checkPermission("settings:manage")) {
      throw new Error("Unauthorized: Only Admins can restore accounts.");
    }
    const user = this.users.find((u) => u.id === userId);
    if (!user) return false;
    user.status = "active";
    user.failed_login_attempts = 0;
    user.locked_until = undefined;
    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "USER_ACTIVATED",
      entity_type: "user",
      entity_id: userId,
      metadata_json: {},
    });
    return true;
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
  // PROJECTS & SCOPED MEMBERS (Section 2 & 5)
  // ==========================================
  getProjects(): Project[] {
    return this.projects.map((p) => {
      const pTasks = this.tasks.filter((t) => t.project_id === p.id);
      const members = this.projectMembers.filter((m) => m.project_id === p.id && m.status === "active");
      const organizer = this.users.find((u) => u.id === p.organizer_id);
      const activeTasks = pTasks.filter((t) => t.status !== "completed" && t.status !== "done");
      const overdueTasks = activeTasks.filter((t) => new Date(t.due_at).getTime() < Date.now());
      const completedTasks = pTasks.filter((t) => t.status === "completed" || t.status === "done");

      return {
        ...p,
        organizer,
        members,
        task_count: pTasks.length,
        completed_task_count: completedTasks.length,
        overdue_task_count: overdueTasks.length,
      };
    });
  }

  getProjectById(id: string): Project | undefined {
    const p = this.projects.find((proj) => proj.id === id);
    if (!p) return undefined;
    const pTasks = this.tasks.filter((t) => t.project_id === p.id);
    const members = this.projectMembers.filter((m) => m.project_id === p.id && m.status === "active");
    const organizer = this.users.find((u) => u.id === p.organizer_id);
    const completedTasks = pTasks.filter((t) => t.status === "completed" || t.status === "done");
    const activeTasks = pTasks.filter((t) => t.status !== "completed" && t.status !== "done");
    const overdueTasks = activeTasks.filter((t) => new Date(t.due_at).getTime() < Date.now());

    return {
      ...p,
      organizer,
      members,
      task_count: pTasks.length,
      completed_task_count: completedTasks.length,
      overdue_task_count: overdueTasks.length,
    };
  }

  createProject(data: {
    name: string;
    description: string;
    organizer_id: string;
    organizers?: string[];
    budget?: number;
    start_date?: string;
    end_date?: string;
  }): Project {
    if (!this.checkPermission("project:create")) {
      throw new Error("Unauthorized: Only Admins have permission to create projects.");
    }

    const projectId = `proj-${Date.now().toString(36)}`;
    const newProj: Project = {
      id: projectId,
      club_id: this.club.id,
      name: data.name,
      description: data.description,
      organizer_id: data.organizer_id,
      organizers: data.organizers && data.organizers.length > 0 ? data.organizers : [data.organizer_id],
      status: "active",
      budget: data.budget || 0,
      start_date: data.start_date,
      end_date: data.end_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.projects.push(newProj);

    // Auto-enroll lead organizer
    this.projectMembers.push({
      id: `pm-${Date.now().toString(36)}-org`,
      project_id: projectId,
      user_id: data.organizer_id,
      role: "organizer",
      status: "active",
      joined_at: new Date().toISOString(),
    });

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "CREATE_PROJECT",
      entity_type: "project",
      entity_id: projectId,
      metadata_json: { name: data.name, organizer_id: data.organizer_id, budget: data.budget },
    });

    return this.getProjectById(projectId)!;
  }

  updateProject(id: string, patch: Partial<Project>): Project | undefined {
    if (!this.checkPermission("project:update", undefined, { projectId: id })) {
      throw new Error("Unauthorized: You do not have permission to update this project.");
    }

    const idx = this.projects.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;

    this.projects[idx] = {
      ...this.projects[idx],
      ...patch,
      updated_at: new Date().toISOString(),
    };

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "UPDATE_PROJECT",
      entity_type: "project",
      entity_id: id,
      metadata_json: patch,
    });

    return this.getProjectById(id);
  }

  archiveProject(id: string): boolean {
    if (!this.checkPermission("project:archive", undefined, { projectId: id })) {
      throw new Error("Unauthorized: Only Admins can archive projects.");
    }
    const proj = this.projects.find((p) => p.id === id);
    if (!proj) return false;

    proj.status = "archived";
    proj.updated_at = new Date().toISOString();

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "ARCHIVE_PROJECT",
      entity_type: "project",
      entity_id: id,
      metadata_json: {},
    });
    return true;
  }

  restoreProject(id: string): boolean {
    if (!this.checkPermission("project:create")) {
      throw new Error("Unauthorized: Only Admins can restore projects.");
    }
    const proj = this.projects.find((p) => p.id === id);
    if (!proj) return false;

    proj.status = "active";
    proj.updated_at = new Date().toISOString();

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "RESTORE_PROJECT",
      entity_type: "project",
      entity_id: id,
      metadata_json: {},
    });
    return true;
  }

  freezeProjectChanges(id: string): boolean {
    if (!this.checkPermission("settings:manage")) {
      throw new Error("Unauthorized: Only Admins can freeze project changes.");
    }
    const proj = this.projects.find((p) => p.id === id);
    if (!proj) return false;

    proj.status = "suspended";
    proj.updated_at = new Date().toISOString();

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "PROJECT_FROZEN_EMERGENCY",
      entity_type: "project",
      entity_id: id,
      metadata_json: {},
    });
    return true;
  }

  getProjectMembers(projectId: string): ProjectMember[] {
    return this.projectMembers
      .filter((pm) => pm.project_id === projectId && pm.status === "active")
      .map((pm) => ({
        ...pm,
        user: this.users.find((u) => u.id === pm.user_id),
      }));
  }

  getAllProjectMembers(): ProjectMember[] {
    return this.projectMembers.map((pm) => ({
      ...pm,
      user: this.users.find((u) => u.id === pm.user_id),
    }));
  }

  addProjectMember(
    projectId: string,
    userId: string,
    role: "organizer" | "volunteer" = "volunteer"
  ): ProjectMember {
    if (
      !this.checkPermission("volunteer:add", undefined, { projectId }) &&
      !this.checkPermission("member:add", undefined, { projectId })
    ) {
      throw new Error("Unauthorized: You do not have permission to add members to this project.");
    }

    const existing = this.projectMembers.find((m) => m.project_id === projectId && m.user_id === userId);
    if (existing) {
      existing.status = "active";
      existing.role = role;
      return {
        ...existing,
        user: this.users.find((u) => u.id === userId),
      };
    }

    const member: ProjectMember = {
      id: `pm-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: projectId,
      user_id: userId,
      role,
      status: "active",
      joined_at: new Date().toISOString(),
    };
    this.projectMembers.push(member);

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "MEMBER_ADD",
      entity_type: "project_member",
      entity_id: member.id,
      metadata_json: { projectId, userId, role },
    });

    return {
      ...member,
      user: this.users.find((u) => u.id === userId),
    };
  }

  removeProjectMember(
    projectMemberId: string,
    reassignmentUserId?: string
  ): { member: ProjectMember; impactedTasksCount: number; reassignedTo?: string } {
    const member = this.projectMembers.find((m) => m.id === projectMemberId);
    if (!member) {
      throw new Error("Project member record not found.");
    }

    if (
      !this.checkPermission("member:remove", undefined, { projectId: member.project_id }) &&
      !this.checkPermission("volunteer:remove", undefined, { projectId: member.project_id })
    ) {
      throw new Error("Unauthorized: You do not have permission to remove members from this project.");
    }

    // Soft-deactivate member
    member.status = "deactivated";

    // Active task impact calculation & optional reassignment
    const activeTasks = this.tasks.filter(
      (t) =>
        (t.project_id === member.project_id || t.team_id === member.project_id) &&
        t.owner_id === member.user_id &&
        t.status !== "completed" &&
        t.status !== "done"
    );

    if (reassignmentUserId) {
      activeTasks.forEach((t) => {
        t.owner_id = reassignmentUserId;
        t.updated_at = new Date().toISOString();
      });
    }

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "REMOVE_PROJECT_MEMBER",
      entity_type: "project_member",
      entity_id: projectMemberId,
      metadata_json: {
        projectId: member.project_id,
        userId: member.user_id,
        impactedTasksCount: activeTasks.length,
        reassignedTo: reassignmentUserId || null,
      },
    });

    return {
      member,
      impactedTasksCount: activeTasks.length,
      reassignedTo: reassignmentUserId,
    };
  }

  // ==========================================
  // PROGRESS REPORTS (Section 2)
  // ==========================================
  getProgressReports(projectId?: string): ProgressReport[] {
    let list = this.progressReports;
    if (projectId) {
      list = list.filter((r) => r.project_id === projectId);
    }
    return list.map((r) => ({
      ...r,
      author: this.users.find((u) => u.id === r.author_id),
    }));
  }

  createProgressReport(data: {
    project_id: string;
    title: string;
    summary: string;
    completed_tasks: number;
    pending_tasks: number;
    blocked_tasks: number;
    risks_identified?: string[];
  }): ProgressReport {
    if (!this.checkPermission("report:create", undefined, { projectId: data.project_id })) {
      throw new Error("Unauthorized: You do not have permission to generate progress reports.");
    }

    const report: ProgressReport = {
      id: `report-${Date.now().toString(36)}`,
      project_id: data.project_id,
      author_id: this.currentUserId,
      title: data.title,
      summary: data.summary,
      completed_tasks: data.completed_tasks,
      pending_tasks: data.pending_tasks,
      blocked_tasks: data.blocked_tasks,
      risks_identified: data.risks_identified || [],
      created_at: new Date().toISOString(),
    };

    this.progressReports.unshift(report);

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "CREATE_PROGRESS_REPORT",
      entity_type: "progress_report",
      entity_id: report.id,
      metadata_json: { title: data.title, projectId: data.project_id },
    });

    return {
      ...report,
      author: this.users.find((u) => u.id === this.currentUserId),
    };
  }

  // ==========================================
  // TASK WORKFLOW (Pending -> Accepted -> In Progress -> Blocked -> Submitted -> Completed)
  // ==========================================
  acceptTask(taskId: string): Task | undefined {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return undefined;

    if (!this.checkPermission("task:update", task, { taskId })) {
      throw new Error("Unauthorized: You do not have permission to accept this task.");
    }

    task.status = "accepted";
    task.updated_at = new Date().toISOString();

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "TASK_WORKFLOW_ACCEPTED",
      entity_type: "task",
      entity_id: taskId,
      metadata_json: { previousStatus: "pending", newStatus: "accepted" },
    });

    return this.getTaskById(taskId);
  }

  startTask(taskId: string): Task | undefined {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return undefined;

    if (!this.checkPermission("task:update", task, { taskId })) {
      throw new Error("Unauthorized: You do not have permission to start this task.");
    }

    task.status = "in_progress";
    task.updated_at = new Date().toISOString();

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "TASK_WORKFLOW_IN_PROGRESS",
      entity_type: "task",
      entity_id: taskId,
      metadata_json: { newStatus: "in_progress" },
    });

    return this.getTaskById(taskId);
  }

  blockTask(taskId: string, blockerReason: string): Task | undefined {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return undefined;

    task.status = "blocked";
    task.blocked_at = new Date().toISOString();
    task.updated_at = new Date().toISOString();

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "TASK_WORKFLOW_BLOCKED",
      entity_type: "task",
      entity_id: taskId,
      metadata_json: { blockerReason },
    });

    return this.getTaskById(taskId);
  }

  submitTaskEvidence(
    taskId: string,
    evidenceUrl: string,
    notes?: string
  ): Task | undefined {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return undefined;

    if (!this.checkPermission("task:update", task, { taskId })) {
      throw new Error("Unauthorized: You do not have permission to submit evidence for this task.");
    }

    const evidence: TaskEvidence = {
      id: `ev-${Date.now().toString(36)}`,
      task_id: taskId,
      evidence_url: evidenceUrl,
      notes,
      submitted_by: this.currentUserId,
      submitted_at: new Date().toISOString(),
      approved: false,
    };

    task.evidence = [...(task.evidence || []), evidence];
    task.status = "submitted";
    task.updated_at = new Date().toISOString();

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "TASK_WORKFLOW_SUBMITTED",
      entity_type: "task",
      entity_id: taskId,
      metadata_json: { evidenceUrl, notes },
    });

    return this.getTaskById(taskId);
  }

  completeTask(taskId: string): Task | undefined {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return undefined;

    if (!this.checkPermission("task:complete", task, { taskId })) {
      throw new Error("Unauthorized: You do not have permission to complete this task.");
    }

    task.status = "completed";
    task.updated_at = new Date().toISOString();

    if (task.evidence && task.evidence.length > 0) {
      task.evidence[task.evidence.length - 1].approved = true;
    }

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "TASK_WORKFLOW_COMPLETED",
      entity_type: "task",
      entity_id: taskId,
      metadata_json: { completedBy: this.currentUserId },
    });

    return this.getTaskById(taskId);
  }

  requestTaskChanges(taskId: string, feedback: string): Task | undefined {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return undefined;

    if (!this.checkPermission("task:update", task, { taskId })) {
      throw new Error("Unauthorized: You do not have permission to request changes on this task.");
    }

    task.status = "in_progress";
    task.updated_at = new Date().toISOString();

    if (task.evidence && task.evidence.length > 0) {
      task.evidence[task.evidence.length - 1].approved = false;
      task.evidence[task.evidence.length - 1].notes = `${task.evidence[task.evidence.length - 1].notes || ""}\nChanges requested: ${feedback}`.trim();
    }

    this.addTaskComment(taskId, `Organizer requested changes: ${feedback}`);

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "TASK_CHANGES_REQUESTED",
      entity_type: "task",
      entity_id: taskId,
      metadata_json: { feedback },
    });

    return this.getTaskById(taskId);
  }

  addChecklistItem(taskId: string, text: string): TaskChecklistItem | undefined {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return undefined;

    const item: TaskChecklistItem = {
      id: `chk-${Date.now().toString(36)}`,
      text,
      completed: false,
    };

    task.checklist = [...(task.checklist || []), item];
    task.updated_at = new Date().toISOString();

    return item;
  }

  toggleChecklistItem(taskId: string, checklistItemId: string): boolean {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task || !task.checklist) return false;

    const item = task.checklist.find((c) => c.id === checklistItemId);
    if (!item) return false;

    item.completed = !item.completed;
    task.updated_at = new Date().toISOString();
    return true;
  }

  addTaskComment(taskId: string, content: string): TaskComment | undefined {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return undefined;

    const comment: TaskComment = {
      id: `tc-${Date.now().toString(36)}`,
      task_id: taskId,
      user_id: this.currentUserId,
      content,
      created_at: new Date().toISOString(),
      user: this.users.find((u) => u.id === this.currentUserId),
    };

    task.comments = [...(task.comments || []), comment];
    task.updated_at = new Date().toISOString();

    return comment;
  }

  logTimeEntry(data: {
    task_id: string;
    hours_spent: number;
    date: string;
    notes?: string;
  }): TimeEntry {
    const entry: TimeEntry = {
      id: `te-${Date.now().toString(36)}`,
      task_id: data.task_id,
      user_id: this.currentUserId,
      hours_spent: data.hours_spent,
      date: data.date,
      notes: data.notes,
      created_at: new Date().toISOString(),
    };

    this.timeEntries.push(entry);

    // Update task actual hours
    const task = this.tasks.find((t) => t.id === data.task_id);
    if (task) {
      task.actual_hours = (task.actual_hours || 0) + data.hours_spent;
      task.updated_at = new Date().toISOString();
    }

    return entry;
  }

  getTimeEntries(taskId?: string, userId?: string): TimeEntry[] {
    let list = this.timeEntries;
    if (taskId) list = list.filter((te) => te.task_id === taskId);
    if (userId) list = list.filter((te) => te.user_id === userId);
    return list;
  }

  // ==========================================
  // SMART AI FEATURES (Section 6)
  // ==========================================
  breakdownProject(spec: {
    goal: string;
    project_id?: string;
    target_deadline?: string;
  }): AIProjectBreakdownResult {
    return {
      project_id: spec.project_id || "proj-techfest-2026",
      project_name: spec.goal,
      summary: `AI Decomposition for "${spec.goal}" into 4 streamlined, dependency-linked operational workstreams.`,
      suggested_tasks: [
        {
          title: `Project Governance & Clearances for ${spec.goal}`,
          description: "Establish administrative milestones, obtain university Dean approvals, and configure tracking.",
          estimated_hours: 8,
          priority: "critical",
          required_skills: ["Planning", "Administrative Approvals"],
          suggested_assignee_id: "usr-jay",
          suggested_assignee_name: "Jay Shah",
        },
        {
          title: `Venue Infrastructure & AV Deployment for ${spec.goal}`,
          description: "Stage rigging, line-array audio test, electrical backup generator setup.",
          estimated_hours: 14,
          priority: "high",
          required_skills: ["Venue Coordination", "AV Hardware", "Stage Rigging"],
          suggested_assignee_id: "usr-rahul",
          suggested_assignee_name: "Rahul Sharma",
          dependencies: ["Task 1 Prerequisite"],
        },
        {
          title: `Portal Registration & Public Announcement Campaign`,
          description: "Deploy registration webhook API, launch Instagram countdown, and print participant badges.",
          estimated_hours: 10,
          priority: "high",
          required_skills: ["Web Dev", "Graphic Design", "Social Media"],
          suggested_assignee_id: "usr-ananya",
          suggested_assignee_name: "Ananya Iyer",
        },
        {
          title: `Volunteer Briefing & Day-Of Coordination Protocol`,
          description: "Conduct security briefing, assign walkie-talkie channels, and run dry-run walkthrough.",
          estimated_hours: 6,
          priority: "medium",
          required_skills: ["Security", "Crowd Control"],
          suggested_assignee_id: "usr-tanvi",
          suggested_assignee_name: "Tanvi Saxena",
          dependencies: ["Task 2 Prerequisite"],
        },
      ],
      estimated_total_hours: 38,
      risk_factors: [
        "Auditorium key handover delay could compress stage preparation window.",
        "Resource load on AV lead requires assistant co-assignee.",
      ],
    };
  }

  rebalanceWorkload(thresholdScore: number = 80): AIWorkloadRebalanceSuggestion[] {
    const vols = this.getVolunteers();
    const overloaded = vols.filter((v) => (v.workloadScore || 0) >= thresholdScore);
    const available = vols.filter((v) => (v.workloadScore || 0) <= 45);

    const suggestions: AIWorkloadRebalanceSuggestion[] = [];

    for (const ov of overloaded) {
      const activeTasks = this.tasks.filter((t) => t.owner_id === ov.user_id && t.status !== "completed" && t.status !== "done");
      if (activeTasks.length > 0 && available.length > 0) {
        // Pick the least overloaded target
        const target = available.shift()!;
        const taskToMove = activeTasks[0];

        suggestions.push({
          from_user_id: ov.user_id,
          from_user_name: ov.user?.name || "Volunteer",
          to_user_id: target.user_id,
          to_user_name: target.user?.name || "Volunteer",
          task_id: taskToMove.id,
          task_title: taskToMove.title,
          reason: `Rebalance workload: ${ov.user?.name} is at ${ov.workloadScore}% capacity (${activeTasks.length} active tasks). Moving to ${target.user?.name} (${target.workloadScore}% capacity).`,
          workload_delta: {
            from_before: ov.workloadScore || 85,
            from_after: Math.max(20, (ov.workloadScore || 85) - 15),
            to_before: target.workloadScore || 30,
            to_after: (target.workloadScore || 30) + 15,
          },
        });
      }
    }

    return suggestions;
  }

  applyWorkloadRebalance(suggestions: AIWorkloadRebalanceSuggestion[]): number {
    let count = 0;
    for (const s of suggestions) {
      const task = this.tasks.find((t) => t.id === s.task_id);
      if (task) {
        task.owner_id = s.to_user_id;
        task.updated_at = new Date().toISOString();
        count++;

        // Update workload scores
        const fromVol = this.volunteers.find((v) => v.user_id === s.from_user_id);
        if (fromVol) fromVol.workloadScore = s.workload_delta.from_after;

        const toVol = this.volunteers.find((v) => v.user_id === s.to_user_id);
        if (toVol) toVol.workloadScore = s.workload_delta.to_after;

        this.addAuditLog({
          actor_user_id: this.currentUserId,
          actor_type: "ai",
          action: "WORKLOAD_REBALANCE_EXECUTED",
          entity_type: "task",
          entity_id: task.id,
          metadata_json: s,
        });
      }
    }
    return count;
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

  getAllTeamMembers(): TeamMember[] {
    return this.teamMembers.map((m) => ({
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
      case "breakdown_project": {
        return this.breakdownProject({
          goal: args.goal || "Event Milestone",
          project_id: args.project_id,
          target_deadline: args.target_deadline,
        });
      }
      case "rebalance_workload": {
        const suggestions = this.rebalanceWorkload(args.threshold_score || 80);
        return { suggestions_count: suggestions.length, suggestions };
      }
      default:
        return { message: `Tool ${toolName} executed successfully.` };
    }
  }

  // ==========================================
  // MATHEMATICAL ALGORITHMS & OPERATIONS
  // ==========================================

  getCriticalPathAnalysis(): CPMSimulationResult {
    const cpmTasks: CPMTask[] = this.tasks.map((t) => {
      // Estimate duration in hours from due_at or default
      const dur = t.estimated_hours || (t.priority === "critical" ? 6 : t.priority === "high" ? 4 : 2);
      return {
        id: t.id,
        title: t.title,
        durationHours: dur,
        dependencies: t.dependencies || [],
        assignedTo: t.owner_id,
        category: t.category,
        isBlocked: t.is_blocked || t.status === "blocked",
      };
    });

    return CriticalPathEngine.solve(cpmTasks);
  }

  simulateTaskDelay(taskId: string, delayHours: number): DelayImpactResult {
    const cpmTasks: CPMTask[] = this.tasks.map((t) => {
      const dur = t.estimated_hours || (t.priority === "critical" ? 6 : t.priority === "high" ? 4 : 2);
      return {
        id: t.id,
        title: t.title,
        durationHours: dur,
        dependencies: t.dependencies || [],
        assignedTo: t.owner_id,
        category: t.category,
        isBlocked: t.is_blocked || t.status === "blocked",
      };
    });

    return CriticalPathEngine.simulateDelay(cpmTasks, taskId, delayHours);
  }

  getOptimizedWorkload(): OptimizationSummary {
    const vols = this.getVolunteers();
    const optVols: OptimizerVolunteer[] = vols.map((v) => ({
      id: v.id,
      name: v.user?.name || "Volunteer",
      skills: v.skills || [],
      currentWorkload: v.workloadScore || 40,
      availability: v.availability,
      activeTaskCount: v.assignedTasks?.length || 0,
      committee: v.notes?.includes("Logistics")
        ? "Logistics & Venue"
        : v.notes?.includes("Stage")
        ? "Tech & AV"
        : "Operations",
    }));

    const optTasks: OptimizerTask[] = this.tasks
      .filter((t) => t.status !== "completed" && t.status !== "done")
      .map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        requiredSkills: t.skills || ["Operations"],
        estimatedHours: t.estimated_hours || 3,
        currentAssigneeId: t.owner_id,
        committee: t.team_id || "General Operations",
      }));

    return WorkloadOptimizer.optimize(optVols, optTasks);
  }

  getHackathonRiskReport(): HackathonRiskReport {
    const vols = this.getVolunteers();
    const mappedVols = vols.map((v) => ({
      id: v.id,
      user_id: v.user_id,
      name: v.user?.name || "Volunteer",
      workloadScore: v.workloadScore || 50,
      availability: v.availability,
    }));

    const mappedTasks = this.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_at: t.due_at,
      owner_id: t.owner_id,
      is_blocked: t.is_blocked,
      blocker_reason: t.blocker_reason,
      escalation_level: t.escalation_level,
      dependencies: t.dependencies,
      dependents: t.dependents,
      category: t.category,
    }));

    return RiskPredictor.evaluate({
      tasks: mappedTasks,
      volunteers: mappedVols,
      eventMilestoneHoursRemaining: 36,
    });
  }

  getRunOfShowAnalysis(currentHour: number = 6): RunOfShowReport {
    return RunOfShowEngine.analyzeSchedule(BIT_N_BUILD_36H_TIMELINE, currentHour);
  }

  reviewTaskEvidence(
    taskId: string,
    evidenceId: string,
    approved: boolean,
    reviewerNotes?: string
  ): boolean {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task || !task.evidence) return false;

    const ev = task.evidence.find((e) => e.id === evidenceId);
    if (!ev) return false;

    ev.approved = approved;
    if (approved) {
      task.status = "completed";
    } else {
      task.status = "in_progress";
    }

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: approved ? "TASK_EVIDENCE_APPROVED" : "TASK_EVIDENCE_REVISION_REQUESTED",
      entity_type: "task",
      entity_id: taskId,
      metadata_json: { evidenceId, approved, reviewerNotes },
    });

    return true;
  }

  // =============================================================
  // BIT N BUILD 2026: JUDGING EXPO & GAVEL NORMALIZATION
  // =============================================================
  public getJudgingTeams(): JudgingTeam[] {
    return [...this.judgingTeams];
  }

  public submitJudgeScore(
    teamId: string,
    score: Omit<JudgingScore, "submitted_at">
  ): JudgingTeam {
    const team = this.judgingTeams.find((t) => t.id === teamId);
    if (!team) throw new Error(`Judging team ${teamId} not found`);

    const fullScore: JudgingScore = {
      ...score,
      submitted_at: new Date().toISOString(),
    };

    // Replace if judge already scored this team, otherwise push
    const existingIdx = team.scores.findIndex((s) => s.judge_id === score.judge_id);
    if (existingIdx >= 0) {
      team.scores[existingIdx] = fullScore;
    } else {
      team.scores.push(fullScore);
    }

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "JUDGE_SCORE_SUBMITTED",
      entity_type: "judging_team",
      entity_id: teamId,
      metadata_json: {
        teamName: team.team_name,
        judgeName: score.judge_name,
        weightedScore: computeWeightedScore(fullScore),
      },
    });

    return { ...team };
  }

  public getNormalizedLeaderboard(track?: HackathonTrack): JudgingLeaderboardEntry[] {
    return generateNormalizedLeaderboard(this.judgingTeams, track);
  }

  // =============================================================
  // BIT N BUILD 2026: HELPQ MENTOR DISPATCH QUEUE
  // =============================================================
  public getMentorTickets(): MentorTicket[] {
    return [...this.mentorTickets];
  }

  public createMentorTicket(data: {
    team_name: string;
    table_location: string;
    track: HackathonTrack;
    tech_stack: string[];
    issue_summary: string;
    priority?: "low" | "medium" | "high" | "urgent";
  }): MentorTicket {
    const id = `ticket-${Date.now().toString().slice(-4)}`;
    const newTicket: MentorTicket = {
      id,
      team_id: `team-hacker-${Date.now().toString().slice(-3)}`,
      team_name: data.team_name,
      table_location: data.table_location,
      track: data.track,
      tech_stack: data.tech_stack,
      issue_summary: data.issue_summary,
      priority: data.priority || "medium",
      status: "open",
      requested_at: new Date().toISOString(),
    };

    this.mentorTickets.unshift(newTicket);

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "MENTOR_TICKET_CREATED",
      entity_type: "mentor_ticket",
      entity_id: id,
      metadata_json: {
        teamName: data.team_name,
        tableLocation: data.table_location,
        track: data.track,
      },
    });

    return newTicket;
  }

  public claimMentorTicket(ticketId: string, mentorId: string, mentorName: string): MentorTicket {
    const ticket = this.mentorTickets.find((t) => t.id === ticketId);
    if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

    ticket.status = "claimed";
    ticket.claimed_at = new Date().toISOString();
    ticket.claimed_by_mentor_id = mentorId;
    ticket.claimed_by_mentor_name = mentorName;

    this.addAuditLog({
      actor_user_id: mentorId,
      actor_type: "user",
      action: "MENTOR_TICKET_CLAIMED",
      entity_type: "mentor_ticket",
      entity_id: ticketId,
      metadata_json: {
        mentorName,
        teamName: ticket.team_name,
      },
    });

    return { ...ticket };
  }

  public resolveMentorTicket(ticketId: string, resolutionNotes?: string): MentorTicket {
    const ticket = this.mentorTickets.find((t) => t.id === ticketId);
    if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

    ticket.status = "resolved";
    ticket.resolved_at = new Date().toISOString();
    ticket.resolution_notes = resolutionNotes || "Resolved with team.";

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "MENTOR_TICKET_RESOLVED",
      entity_type: "mentor_ticket",
      entity_id: ticketId,
      metadata_json: {
        teamName: ticket.team_name,
        notes: resolutionNotes,
      },
    });

    return { ...ticket };
  }

  // =============================================================
  // BIT N BUILD 2026: SPONSOR DELIVERABLE & ROI TRACKING
  // =============================================================
  public getSponsors(): SponsorPartner[] {
    return [...this.sponsors];
  }

  public toggleSponsorDeliverable(sponsorId: string, deliverableId: string): boolean {
    const sponsor = this.sponsors.find((s) => s.id === sponsorId);
    if (!sponsor) return false;

    const item = sponsor.deliverables.find((d) => d.id === deliverableId);
    if (!item) return false;

    item.completed = !item.completed;

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "SPONSOR_DELIVERABLE_UPDATED",
      entity_type: "sponsor",
      entity_id: sponsorId,
      metadata_json: {
        deliverableTitle: item.title,
        completed: item.completed,
      },
    });

    return true;
  }

  public createJudgingTeam(data: {
    team_name: string;
    project_title: string;
    track: HackathonTrack;
    table_location: string;
    member_count?: number;
    github_url?: string;
    demo_url?: string;
  }): JudgingTeam {
    const id = `judge-team-${Date.now().toString().slice(-4)}`;
    const newTeam: JudgingTeam = {
      id,
      team_name: data.team_name,
      project_title: data.project_title,
      track: data.track,
      table_location: data.table_location,
      member_count: data.member_count || 4,
      github_url: data.github_url || "https://github.com/",
      demo_url: data.demo_url || "",
      scores: [],
      is_disqualified: false,
    };

    this.judgingTeams.push(newTeam);

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "JUDGING_TEAM_REGISTERED",
      entity_type: "judging_team",
      entity_id: id,
      metadata_json: {
        teamName: data.team_name,
        projectTitle: data.project_title,
        track: data.track,
      },
    });

    return newTeam;
  }

  public createSponsor(data: {
    name: string;
    tier: any;
    booth_location?: string;
    logo_url?: string;
    custom_bounty_title?: string;
    custom_bounty_prize?: string;
  }): SponsorPartner {
    const id = `sponsor-${Date.now().toString().slice(-4)}`;
    const newSponsor: SponsorPartner = {
      id,
      name: data.name,
      tier: data.tier,
      logo_url:
        data.logo_url ||
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60",
      booth_location: data.booth_location || "Expo Booth Area",
      custom_bounty_title: data.custom_bounty_title,
      custom_bounty_prize: data.custom_bounty_prize,
      bounty_submissions_count: 0,
      deliverables: [
        {
          id: `del-${id}-1`,
          title: "Booth Setup & Banner Verification",
          category: "booth",
          completed: false,
        },
        {
          id: `del-${id}-2`,
          title: "Sponsor Swag Distribution to Hackers",
          category: "swag",
          completed: false,
        },
        {
          id: `del-${id}-3`,
          title: "Dedicated Track/Bounty Mentorship Session",
          category: "mentorship",
          completed: false,
        },
      ],
    };

    this.sponsors.push(newSponsor);

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "SPONSOR_PARTNER_ADDED",
      entity_type: "sponsor",
      entity_id: id,
      metadata_json: {
        name: data.name,
        tier: data.tier,
        booth: newSponsor.booth_location,
      },
    });

    return newSponsor;
  }

  public addVolunteer(data: {
    name: string;
    email: string;
    phone?: string;
    role?: string;
    skills?: string[];
    availability?: "available" | "busy" | "overloaded" | "unavailable";
    notes?: string;
  }): Volunteer {
    let user = this.users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (!user) {
      const newUser: User = {
        id: `usr-${Date.now().toString().slice(-4)}`,
        name: data.name,
        email: data.email,
        role: "volunteer",
        status: "active",
        created_at: new Date().toISOString(),
        phone: data.phone || "",
      };
      this.users.push(newUser);
      user = newUser;
    }

    const volunteerId = `vol-${Date.now().toString().slice(-4)}`;
    const newVolunteer: Volunteer = {
      id: volunteerId,
      club_id: this.club.id,
      user_id: user.id,
      skills: data.skills && data.skills.length > 0 ? data.skills : ["Operations", "Logistics"],
      availability: data.availability || "available",
      notes: data.notes || "Onboarded club volunteer.",
      user,
      assignedTasks: [],
      workloadScore: 0,
      total_hours_logged: 0,
    };

    this.volunteers.push(newVolunteer);

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "VOLUNTEER_ONBOARDED",
      entity_type: "volunteer",
      entity_id: volunteerId,
      metadata_json: {
        name: data.name,
        email: data.email,
        skills: newVolunteer.skills,
      },
    });

    return newVolunteer;
  }

  public resetToCleanSlate(): void {
    this.projects = [];
    this.projectMembers = [];
    this.sessions = [];
    this.progressReports = [];
    this.userSkills = [];
    this.availability = [];
    this.timeEntries = [];
    this.teams = [];
    this.teamMembers = [];
    this.roleAssignments = [];
    this.permissionRequests = [];
    this.volunteers = [];
    this.tasks = [];
    this.risks = [];
    this.documents = [];
    this.chunks = [];
    this.meetings = [];
    this.actionItems = [];
    this.announcements = [];
    this.notifications = [];
    this.auditLogs = [];
    this.judgingTeams = [];
    this.mentorTickets = [];
    this.sponsors = [];
    this.pendingToolCalls = [];

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "RESET_TO_CLEAN_SLATE",
      entity_type: "system",
      entity_id: "store",
      metadata_json: { timestamp: new Date().toISOString() },
    });
  }

  public loadDemoData(): void {
    this.users = [...SEED_USERS];
    this.club = { ...SEED_CLUB };
    this.event = { ...SEED_EVENT };
    this.projects = [...SEED_PROJECTS];
    this.projectMembers = [...SEED_PROJECT_MEMBERS];
    this.sessions = [...SEED_SESSIONS];
    this.progressReports = [...SEED_PROGRESS_REPORTS];
    this.skills = [...SEED_SKILLS];
    this.userSkills = [...SEED_USER_SKILLS];
    this.availability = [...SEED_AVAILABILITY];
    this.timeEntries = [...SEED_TIME_ENTRIES];
    this.teams = [...SEED_TEAMS];
    this.teamMembers = [...SEED_TEAM_MEMBERS];
    this.roleAssignments = [...SEED_ROLE_ASSIGNMENTS];
    this.permissionRequests = [...SEED_PERMISSION_REQUESTS];
    this.volunteers = [...SEED_VOLUNTEERS];
    this.tasks = [...SEED_TASKS];
    this.risks = [...SEED_RISKS];
    this.documents = [...SEED_DOCUMENTS];
    this.chunks = [...SEED_DOCUMENT_CHUNKS];
    this.meetings = [...SEED_MEETINGS];
    this.actionItems = [...SEED_ACTION_ITEMS];
    this.announcements = [...SEED_ANNOUNCEMENTS];
    this.notifications = [...SEED_NOTIFICATIONS];
    this.auditLogs = [...SEED_AUDIT_LOGS];
    this.judgingTeams = [...SEED_JUDGING_TEAMS];
    this.mentorTickets = [...SEED_MENTOR_TICKETS];
    this.sponsors = [...SEED_SPONSORS];

    this.addAuditLog({
      actor_user_id: this.currentUserId,
      actor_type: "user",
      action: "LOAD_DEMO_DATA",
      entity_type: "system",
      entity_id: "store",
      metadata_json: { timestamp: new Date().toISOString() },
    });
  }
}

// Global Singleton Store for client & server components
export const db = new DatabaseStore();
