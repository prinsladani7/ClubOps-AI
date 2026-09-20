"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  User,
  Event,
  Project,
  ProjectMember,
  UserSession,
  ProgressReport,
  TimeEntry,
  Task,
  TaskChecklistItem,
  TaskComment,
  TaskEvidence,
  Volunteer,
  Meeting,
  MeetingActionItem,
  Document,
  Risk,
  Announcement,
  Notification,
  AuditLog,
  AIToolCall,
  UserRole,
  Team,
  TeamMember,
  RoleAssignment,
  PermissionRequest,
  PermissionAction,
  PermissionScope,
  AITeamRecommendation,
  AIProjectBreakdownResult,
  AIWorkloadRebalanceSuggestion,
  JudgingTeam,
  JudgingScore,
  JudgingLeaderboardEntry,
  MentorTicket,
  SponsorPartner,
  HackathonTrack,
} from "@/types";
import { db } from "@/lib/db";
import { aiProvider } from "@/lib/ai/provider";
import { CPMSimulationResult, DelayImpactResult } from "@/lib/algorithms/cpm";
import { OptimizationSummary } from "@/lib/algorithms/workload-optimizer";
import { HackathonRiskReport } from "@/lib/algorithms/risk-predictor";
import { RunOfShowReport } from "@/lib/algorithms/run-of-show";

interface ClubOpsContextType {
  currentUser: User;
  switchUser: (userId: string) => void;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (email: string, password?: string, intendedRole?: UserRole) => Promise<{ success: boolean; error?: string; pendingVerification?: boolean }>;
  loginAsPersona: (userId: string) => void;
  register: (name: string, email: string, role: UserRole, password?: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (tokenOrEmail: string) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (token: string, newPassword?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  users: User[];
  event: Event;
  updateEventDetails: (patch: Partial<Event>) => void;
  tasks: Task[];
  refreshTasks: () => void;
  createNewTask: (data: Omit<Task, "id" | "created_at" | "updated_at">) => Task;
  updateTaskItem: (id: string, patch: Partial<Task>) => void;
  deleteTaskItem: (id: string) => void;
  volunteers: Volunteer[];
  meetings: Meeting[];
  actionItems: MeetingActionItem[];
  extractActions: (meetingId: string, text: string) => MeetingActionItem[];
  approveActions: (ids: string[]) => void;
  documents: Document[];
  uploadNewDocument: (name: string, visibility: Document["visibility"], content: string) => void;
  risks: Risk[];
  triggerRiskAnalysis: () => void;
  updateRisk: (id: string, status: Risk["status"]) => void;
  announcements: Announcement[];
  publishAnnouncement: (title: string, body: string) => void;
  notifications: Notification[];
  markRead: (id: string) => void;
  auditLogs: AuditLog[];
  runAICommand: (command: string) => Promise<{
    content: string;
    toolCall?: AIToolCall;
    requiresApproval?: boolean;
    sources?: any[];
  }>;
  approveTool: (toolCallId: string, approved: boolean) => { success: boolean; result?: any };
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // RBAC & Teams
  teams: Team[];
  teamMembers: TeamMember[];
  roleAssignments: RoleAssignment[];
  permissionRequests: PermissionRequest[];
  createTeam: (data: { name: string; description: string; organizer_id: string; event_id?: string }) => Team;
  updateTeam: (id: string, patch: Partial<Team>) => void;
  archiveTeam: (id: string) => void;
  suspendTeam: (id: string) => void;
  addTeamMember: (teamId: string, userId: string, role?: "organizer" | "volunteer" | "acting_organizer") => void;
  removeTeamMember: (teamMemberId: string) => void;
  transferTeamMember: (teamMemberId: string, targetTeamId: string) => void;
  assignTemporaryRole: (data: { user_id: string; role: string; scope_type: PermissionScope; scope_id: string; expires_at: string; starts_at?: string }) => RoleAssignment;
  assignActingOrganizer: (teamId: string, volunteerUserId: string, durationHours?: number) => RoleAssignment;
  revokeRoleAssignment: (id: string) => void;
  createPermissionRequest: (data: { permission: PermissionAction; scope_type: PermissionScope; scope_id: string; resource_type: string; resource_id?: string; reason: string; duration_hours?: number }) => PermissionRequest;
  reviewPermissionRequest: (requestId: string, action: "approve" | "reject" | "temporarily_approve", tempDurationHours?: number, reviewNotes?: string) => void;
  delegateTask: (taskId: string, targetUserId: string, reason?: string) => Task | undefined;
  escalateTask: (taskId: string, blockerDescription: string) => Task | undefined;
  resolveTaskBlocker: (taskId: string, notes?: string) => Task | undefined;
  recommendTeam: (spec: { goal: string; required_skills?: string[]; max_members?: number }) => AITeamRecommendation;
  createTeamFromRecommendation: (rec: AITeamRecommendation) => Team;

  // Projects & Relational Operations (Specification Sections 1, 2, 4, 5, 6)
  projects: Project[];
  projectMembers: ProjectMember[];
  sessions: UserSession[];
  progressReports: ProgressReport[];
  createProject: (data: { name: string; description: string; organizer_id: string; budget?: number; start_date?: string; end_date?: string }) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  archiveProject: (id: string) => void;
  addProjectMember: (projectId: string, userId: string, role?: "organizer" | "volunteer") => void;
  removeProjectMember: (projectMemberId: string, reassignmentUserId?: string) => void;
  createProgressReport: (data: { project_id: string; title: string; summary: string; completed_tasks: number; pending_tasks: number; blocked_tasks: number; risks_identified?: string[] }) => ProgressReport;
  acceptTask: (taskId: string) => void;
  startTask: (taskId: string) => void;
  blockTask: (taskId: string, blockerReason: string) => void;
  submitTaskEvidence: (taskId: string, evidenceUrl: string, notes?: string) => void;
  completeTask: (taskId: string) => void;
  addChecklistItem: (taskId: string, text: string) => void;
  toggleChecklistItem: (taskId: string, checklistItemId: string) => void;
  addTaskComment: (taskId: string, content: string) => void;
  logTimeEntry: (data: { task_id: string; hours_spent: number; date: string; notes?: string }) => void;
  breakdownProject: (spec: { goal: string; project_id?: string; target_deadline?: string }) => AIProjectBreakdownResult;
  rebalanceWorkload: (thresholdScore?: number) => AIWorkloadRebalanceSuggestion[];
  applyWorkloadRebalance: (suggestions: AIWorkloadRebalanceSuggestion[]) => void;
  revokeSession: (sessionId: string) => void;
  revokeAllSessions: (userId?: string) => void;
  requestTaskChanges: (taskId: string, feedback: string) => void;
  restoreProject: (id: string) => void;
  freezeProjectChanges: (id: string) => void;
  suspendUser: (userId: string, reason?: string) => void;
  deactivateUser: (userId: string, reason?: string) => void;
  activateUser: (userId: string) => void;

  // Mathematical Algorithms & Real-Time Operations
  getCriticalPathAnalysis: () => CPMSimulationResult;
  simulateTaskDelay: (taskId: string, delayHours: number) => DelayImpactResult;
  getOptimizedWorkload: () => OptimizationSummary;
  getHackathonRiskReport: () => HackathonRiskReport;
  getRunOfShowAnalysis: (currentHour?: number) => RunOfShowReport;
  reviewTaskEvidence: (taskId: string, evidenceId: string, approved: boolean, notes?: string) => boolean;

  // Bit N Build 2026 Hackathon Operations: Judging Expo, HelpQ, Sponsors
  judgingTeams: JudgingTeam[];
  mentorTickets: MentorTicket[];
  sponsors: SponsorPartner[];
  submitJudgeScore: (teamId: string, score: Omit<JudgingScore, "submitted_at">) => void;
  getNormalizedLeaderboard: (track?: HackathonTrack) => JudgingLeaderboardEntry[];
  createMentorTicket: (data: { team_name: string; table_location: string; track: HackathonTrack; tech_stack: string[]; issue_summary: string; priority?: "low" | "medium" | "high" | "urgent" }) => MentorTicket;
  claimMentorTicket: (ticketId: string, mentorId: string, mentorName: string) => void;
  resolveMentorTicket: (ticketId: string, resolutionNotes?: string) => void;
  toggleSponsorDeliverable: (sponsorId: string, deliverableId: string) => void;
}

const ClubOpsContext = createContext<ClubOpsContextType | undefined>(undefined);

export function ClubOpsProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(() => db.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const storedAuth = localStorage.getItem("clubops_auth") === "true";
        const storedUserId = localStorage.getItem("clubops_user_id");
        if (storedAuth && storedUserId) {
          const u = db.getUserById(storedUserId);
          if (u && u.status === "active") {
            db.setCurrentUser(u.id);
            setCurrentUser(u);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem("clubops_auth");
            localStorage.removeItem("clubops_user_id");
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsHydrated(true);
    }
  }, []);
  const [users, setUsers] = useState<User[]>(() => db.getUsers());
  const [event, setEvent] = useState<Event>(() => db.getEvent());
  const [projects, setProjects] = useState<Project[]>(() => db.getProjects());
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>(() => db.getAllProjectMembers());
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => db.getAllTeamMembers());
  const [sessions, setSessions] = useState<UserSession[]>(() => db.getUserSessions());
  const [progressReports, setProgressReports] = useState<ProgressReport[]>(() => db.getProgressReports());
  const [tasks, setTasks] = useState<Task[]>(() => db.getTasks());
  const [volunteers, setVolunteers] = useState<Volunteer[]>(() => db.getVolunteers());
  const [meetings, setMeetings] = useState<Meeting[]>(() => db.getMeetings());
  const [actionItems, setActionItems] = useState<MeetingActionItem[]>([]);
  const [documents, setDocuments] = useState<Document[]>(() => db.getDocuments());
  const [risks, setRisks] = useState<Risk[]>(() => db.getRisks());
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => db.getAnnouncements());
  const [notifications, setNotifications] = useState<Notification[]>(() => db.getNotifications());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => db.getAuditLogs());
  const [teams, setTeams] = useState<Team[]>(() => db.getTeams());
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>(() => db.getRoleAssignments());
  const [permissionRequests, setPermissionRequests] = useState<PermissionRequest[]>(() => db.getPermissionRequests());
  const [judgingTeams, setJudgingTeams] = useState<JudgingTeam[]>(() => db.getJudgingTeams());
  const [mentorTickets, setMentorTickets] = useState<MentorTicket[]>(() => db.getMentorTickets());
  const [sponsors, setSponsors] = useState<SponsorPartner[]>(() => db.getSponsors());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const refreshAll = useCallback(() => {
    setCurrentUser(db.getCurrentUser());
    setUsers(db.getUsers());
    setEvent(db.getEvent());
    setProjects(db.getProjects());
    setProjectMembers(db.getAllProjectMembers());
    setTeamMembers(db.getAllTeamMembers());
    setSessions(db.getUserSessions());
    setProgressReports(db.getProgressReports());
    setTasks(db.getTasks());
    setVolunteers(db.getVolunteers());
    setMeetings(db.getMeetings());
    setDocuments(db.getDocuments());
    setRisks(db.getRisks());
    setAnnouncements(db.getAnnouncements());
    setNotifications(db.getNotifications());
    setAuditLogs(db.getAuditLogs());
    setTeams(db.getTeams());
    setRoleAssignments(db.getRoleAssignments());
    setPermissionRequests(db.getPermissionRequests());
    setJudgingTeams(db.getJudgingTeams());
    setMentorTickets(db.getMentorTickets());
    setSponsors(db.getSponsors());
  }, []);

  const switchUser = useCallback((userId: string) => {
    const user = db.setCurrentUser(userId);
    setCurrentUser(user);
    refreshAll();
    showToast(`Switched active persona to ${user.name} (${user.role.toUpperCase()})`);
  }, [refreshAll, showToast]);

  const loginAsPersona = useCallback((userId: string) => {
    const user = db.setCurrentUser(userId);
    setCurrentUser(user);
    setIsAuthenticated(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("clubops_auth", "true");
      localStorage.setItem("clubops_user_id", userId);
    }
    refreshAll();
    showToast(`Welcome back, ${user.name}! Authenticated as ${user.role.toUpperCase()}.`);
  }, [refreshAll, showToast]);

  const login = useCallback(async (email: string, password?: string, intendedRole?: UserRole) => {
    const res = db.loginUser(email, password, intendedRole);
    if (!res.success) {
      return res;
    }
    if (res.user) {
      setCurrentUser(res.user);
      setIsAuthenticated(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("clubops_auth", "true");
        localStorage.setItem("clubops_user_id", res.user.id);
      }
      refreshAll();
      showToast(`Signed in successfully as ${res.user.name} (${res.user.role.toUpperCase()}).`);
    }
    return { success: true };
  }, [refreshAll, showToast]);

  const register = useCallback(async (name: string, email: string, role: UserRole, password?: string) => {
    if (!name || !email) {
      return { success: false, error: "Name and email are required." };
    }
    const user = db.registerUser(name, email, role);
    db.setCurrentUser(user.id);
    setCurrentUser(user);
    setIsAuthenticated(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("clubops_auth", "true");
      localStorage.setItem("clubops_user_id", user.id);
    }
    refreshAll();
    showToast(`Account created! Signed in as ${user.name}.`);
    return { success: true };
  }, [refreshAll, showToast]);

  const verifyEmail = useCallback(async (tokenOrEmail: string) => {
    const res = db.verifyEmail(tokenOrEmail);
    refreshAll();
    if (res.success) {
      showToast("Email successfully verified! Account is now active.");
    }
    return res;
  }, [refreshAll, showToast]);

  const forgotPassword = useCallback(async (email: string) => {
    const res = db.forgotPassword(email);
    refreshAll();
    showToast(res.message);
    return res;
  }, [refreshAll, showToast]);

  const resetPassword = useCallback(async (token: string, newPassword?: string) => {
    const res = db.resetPassword(token, newPassword);
    refreshAll();
    showToast(res.message);
    return res;
  }, [refreshAll, showToast]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("clubops_auth");
      localStorage.removeItem("clubops_user_id");
    }
    showToast("You have been signed out. Please log in to continue.");
  }, [showToast]);

  const updateEventDetails = useCallback((patch: Partial<Event>) => {
    const updated = db.updateEvent(patch);
    setEvent(updated);
    refreshAll();
    showToast("Event configuration updated.");
  }, [refreshAll, showToast]);

  const createNewTask = useCallback((data: Omit<Task, "id" | "created_at" | "updated_at">) => {
    const task = db.createTask(data);
    refreshAll();
    showToast(`Task created: "${task.title}"`);
    return task;
  }, [refreshAll, showToast]);

  const updateTaskItem = useCallback((id: string, patch: Partial<Task>) => {
    db.updateTask(id, patch);
    refreshAll();
  }, [refreshAll]);

  const deleteTaskItem = useCallback((id: string) => {
    db.deleteTask(id);
    refreshAll();
    showToast("Task removed.");
  }, [refreshAll, showToast]);

  const extractActions = useCallback((meetingId: string, text: string) => {
    const items = db.extractActionItemsFromTranscript(meetingId, text);
    setActionItems(items);
    refreshAll();
    showToast(`AI extracted ${items.length} actionable items.`);
    return items;
  }, [refreshAll, showToast]);

  const approveActions = useCallback((ids: string[]) => {
    const created = db.approveActionItems(ids);
    refreshAll();
    showToast(`Approved ${created.length} meeting items into active tasks.`);
  }, [refreshAll, showToast]);

  const uploadNewDocument = useCallback((name: string, visibility: Document["visibility"], content: string) => {
    db.uploadDocument(name, visibility, content);
    refreshAll();
    showToast(`Document "${name}" indexed for RAG vector retrieval.`);
  }, [refreshAll, showToast]);

  const triggerRiskAnalysis = useCallback(() => {
    const freshRisks = db.runRiskAnalysis();
    setRisks(freshRisks);
    refreshAll();
    showToast(`Risk engine ran: ${freshRisks.length} threats evaluated.`);
  }, [refreshAll, showToast]);

  const updateRisk = useCallback((id: string, status: Risk["status"]) => {
    db.updateRiskStatus(id, status);
    refreshAll();
    showToast(`Risk status updated to ${status}.`);
  }, [refreshAll, showToast]);

  const publishAnnouncement = useCallback((title: string, body: string) => {
    db.createAnnouncement(title, body);
    refreshAll();
    showToast(`Announcement published.`);
  }, [refreshAll, showToast]);

  const markRead = useCallback((id: string) => {
    db.markNotificationAsRead(id);
    refreshAll();
  }, [refreshAll]);

  const runAICommand = useCallback(async (command: string) => {
    const result = await aiProvider.processCommand(command, currentUser);
    refreshAll();
    return result;
  }, [currentUser, refreshAll]);

  const approveTool = useCallback((toolCallId: string, approved: boolean) => {
    const res = db.approveAITool(toolCallId, approved);
    refreshAll();
    if (res.success) {
      showToast("AI action approved and executed successfully.");
    } else {
      showToast("AI action cancelled.");
    }
    return res;
  }, [refreshAll, showToast]);

  const createTeam = useCallback((data: { name: string; description: string; organizer_id: string; event_id?: string }) => {
    const team = db.createTeam(data);
    refreshAll();
    showToast(`Team "${team.name}" created successfully.`);
    return team;
  }, [refreshAll, showToast]);

  const updateTeam = useCallback((id: string, patch: Partial<Team>) => {
    db.updateTeam(id, patch);
    refreshAll();
    showToast("Team updated.");
  }, [refreshAll, showToast]);

  const archiveTeam = useCallback((id: string) => {
    db.archiveTeam(id);
    refreshAll();
    showToast("Team archived.");
  }, [refreshAll, showToast]);

  const suspendTeam = useCallback((id: string) => {
    db.suspendTeam(id);
    refreshAll();
    showToast("Team suspended.");
  }, [refreshAll, showToast]);

  const addTeamMember = useCallback((teamId: string, userId: string, role?: "organizer" | "volunteer" | "acting_organizer") => {
    db.addTeamMember(teamId, userId, role);
    refreshAll();
    showToast("Team member added.");
  }, [refreshAll, showToast]);

  const removeTeamMember = useCallback((teamMemberId: string) => {
    db.removeTeamMember(teamMemberId);
    refreshAll();
    showToast("Member removed from team.");
  }, [refreshAll, showToast]);

  const transferTeamMember = useCallback((teamMemberId: string, targetTeamId: string) => {
    db.transferTeamMember(teamMemberId, targetTeamId);
    refreshAll();
    showToast("Member transferred to team.");
  }, [refreshAll, showToast]);

  const assignTemporaryRole = useCallback((data: { user_id: string; role: string; scope_type: PermissionScope; scope_id: string; expires_at: string; starts_at?: string }) => {
    const ra = db.assignTemporaryRole(data);
    refreshAll();
    showToast(`Granted temporary role ${data.role}.`);
    return ra;
  }, [refreshAll, showToast]);

  const assignActingOrganizer = useCallback((teamId: string, volunteerUserId: string, durationHours?: number) => {
    const ra = db.assignActingOrganizer(teamId, volunteerUserId, durationHours);
    refreshAll();
    showToast(`Acting Organizer assigned for ${durationHours || 48} hours.`);
    return ra;
  }, [refreshAll, showToast]);

  const revokeRoleAssignment = useCallback((id: string) => {
    db.revokeRoleAssignment(id);
    refreshAll();
    showToast("Role assignment revoked.");
  }, [refreshAll, showToast]);

  const createPermissionRequest = useCallback((data: { permission: PermissionAction; scope_type: PermissionScope; scope_id: string; resource_type: string; resource_id?: string; reason: string; duration_hours?: number }) => {
    const req = db.createPermissionRequest(data);
    refreshAll();
    showToast(`Access request submitted for "${data.permission}".`);
    return req;
  }, [refreshAll, showToast]);

  const reviewPermissionRequest = useCallback((requestId: string, action: "approve" | "reject" | "temporarily_approve", tempDurationHours?: number, reviewNotes?: string) => {
    db.reviewPermissionRequest(requestId, action, tempDurationHours, reviewNotes);
    refreshAll();
    showToast(`Permission request ${action.replace("_", " ")}.`);
  }, [refreshAll, showToast]);

  const delegateTask = useCallback((taskId: string, targetUserId: string, reason?: string) => {
    const task = db.delegateTask(taskId, targetUserId, reason);
    refreshAll();
    showToast(`Task delegated.`);
    return task;
  }, [refreshAll, showToast]);

  const escalateTask = useCallback((taskId: string, blockerDescription: string) => {
    const task = db.escalateTask(taskId, blockerDescription);
    refreshAll();
    showToast(`🚨 Task escalated to ${task?.escalation_level?.toUpperCase()} level!`);
    return task;
  }, [refreshAll, showToast]);

  const resolveTaskBlocker = useCallback((taskId: string, notes?: string) => {
    const task = db.resolveTaskBlocker(taskId, notes);
    refreshAll();
    showToast("Blocker resolved. Task restored to in progress.");
    return task;
  }, [refreshAll, showToast]);

  const recommendTeam = useCallback((spec: { goal: string; required_skills?: string[]; max_members?: number }) => {
    return db.recommendTeam(spec);
  }, []);

  const createTeamFromRecommendation = useCallback((rec: AITeamRecommendation) => {
    const team = db.createTeamFromRecommendation(rec);
    refreshAll();
    showToast(`Team "${team.name}" established from AI recommendation.`);
    return team;
  }, [refreshAll, showToast]);

  // Project & Task Workflow Context Handlers
  const createProject = useCallback((data: { name: string; description: string; organizer_id: string; budget?: number; start_date?: string; end_date?: string }) => {
    const proj = db.createProject(data);
    refreshAll();
    showToast(`Project "${proj.name}" established.`);
    return proj;
  }, [refreshAll, showToast]);

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    db.updateProject(id, patch);
    refreshAll();
    showToast("Project details updated.");
  }, [refreshAll, showToast]);

  const archiveProject = useCallback((id: string) => {
    db.archiveProject(id);
    refreshAll();
    showToast("Project archived.");
  }, [refreshAll, showToast]);

  const addProjectMember = useCallback((projectId: string, userId: string, role?: "organizer" | "volunteer") => {
    db.addProjectMember(projectId, userId, role);
    refreshAll();
    showToast("Member assigned to project scope.");
  }, [refreshAll, showToast]);

  const removeProjectMember = useCallback((projectMemberId: string, reassignmentUserId?: string) => {
    const res = db.removeProjectMember(projectMemberId, reassignmentUserId);
    refreshAll();
    showToast(`Member deactivated (${res.impactedTasksCount} tasks ${reassignmentUserId ? "reassigned" : "pending reassignment"}).`);
  }, [refreshAll, showToast]);

  const createProgressReport = useCallback((data: { project_id: string; title: string; summary: string; completed_tasks: number; pending_tasks: number; blocked_tasks: number; risks_identified?: string[] }) => {
    const rep = db.createProgressReport(data);
    refreshAll();
    showToast(`Progress Report "${rep.title}" published.`);
    return rep;
  }, [refreshAll, showToast]);

  const acceptTask = useCallback((taskId: string) => {
    db.acceptTask(taskId);
    refreshAll();
    showToast("Task accepted.");
  }, [refreshAll, showToast]);

  const startTask = useCallback((taskId: string) => {
    db.startTask(taskId);
    refreshAll();
    showToast("Task moved to In Progress.");
  }, [refreshAll, showToast]);

  const blockTask = useCallback((taskId: string, blockerReason: string) => {
    db.blockTask(taskId, blockerReason);
    refreshAll();
    showToast("Task flagged as Blocked.");
  }, [refreshAll, showToast]);

  const submitTaskEvidence = useCallback((taskId: string, evidenceUrl: string, notes?: string) => {
    db.submitTaskEvidence(taskId, evidenceUrl, notes);
    refreshAll();
    showToast("Deliverable evidence submitted for verification.");
  }, [refreshAll, showToast]);

  const completeTask = useCallback((taskId: string) => {
    db.completeTask(taskId);
    refreshAll();
    showToast("Task verified & completed!");
  }, [refreshAll, showToast]);

  const addChecklistItem = useCallback((taskId: string, text: string) => {
    db.addChecklistItem(taskId, text);
    refreshAll();
  }, [refreshAll]);

  const toggleChecklistItem = useCallback((taskId: string, checklistItemId: string) => {
    db.toggleChecklistItem(taskId, checklistItemId);
    refreshAll();
  }, [refreshAll]);

  const addTaskComment = useCallback((taskId: string, content: string) => {
    db.addTaskComment(taskId, content);
    refreshAll();
    showToast("Comment recorded.");
  }, [refreshAll, showToast]);

  const logTimeEntry = useCallback((data: { task_id: string; hours_spent: number; date: string; notes?: string }) => {
    db.logTimeEntry(data);
    refreshAll();
    showToast(`Logged ${data.hours_spent} hours.`);
  }, [refreshAll, showToast]);

  const breakdownProject = useCallback((spec: { goal: string; project_id?: string; target_deadline?: string }) => {
    return db.breakdownProject(spec);
  }, []);

  const rebalanceWorkload = useCallback((thresholdScore?: number) => {
    return db.rebalanceWorkload(thresholdScore);
  }, []);

  const applyWorkloadRebalance = useCallback((suggestions: AIWorkloadRebalanceSuggestion[]) => {
    const count = db.applyWorkloadRebalance(suggestions);
    refreshAll();
    showToast(`Successfully reallocated ${count} tasks across volunteer roster.`);
  }, [refreshAll, showToast]);

  const revokeSession = useCallback((sessionId: string) => {
    db.revokeSession(sessionId);
    refreshAll();
    showToast("Session revoked.");
  }, [refreshAll, showToast]);

  const revokeAllSessions = useCallback((userId?: string) => {
    const count = db.revokeAllSessions(userId);
    refreshAll();
    showToast(`Revoked ${count} active session(s).`);
  }, [refreshAll, showToast]);

  const requestTaskChanges = useCallback((taskId: string, feedback: string) => {
    db.requestTaskChanges(taskId, feedback);
    refreshAll();
    showToast("Feedback submitted. Changes requested from volunteer.");
  }, [refreshAll, showToast]);

  const restoreProject = useCallback((id: string) => {
    db.restoreProject(id);
    refreshAll();
    showToast("Project restored to active status.");
  }, [refreshAll, showToast]);

  const freezeProjectChanges = useCallback((id: string) => {
    db.freezeProjectChanges(id);
    refreshAll();
    showToast("Emergency Freeze: Project changes halted.");
  }, [refreshAll, showToast]);

  const suspendUser = useCallback((userId: string, reason?: string) => {
    db.suspendUser(userId, reason);
    refreshAll();
    showToast("Account suspended and all active sessions revoked.");
  }, [refreshAll, showToast]);

  const deactivateUser = useCallback((userId: string, reason?: string) => {
    db.deactivateUser(userId, reason);
    refreshAll();
    showToast("Account deactivated.");
  }, [refreshAll, showToast]);

  const activateUser = useCallback((userId: string) => {
    db.activateUser(userId);
    refreshAll();
    showToast("Account restored to active state.");
  }, [refreshAll, showToast]);

  const getCriticalPathAnalysis = useCallback(() => {
    return db.getCriticalPathAnalysis();
  }, []);

  const simulateTaskDelay = useCallback((taskId: string, delayHours: number) => {
    return db.simulateTaskDelay(taskId, delayHours);
  }, []);

  const getOptimizedWorkload = useCallback(() => {
    return db.getOptimizedWorkload();
  }, []);

  const getHackathonRiskReport = useCallback(() => {
    return db.getHackathonRiskReport();
  }, []);

  const getRunOfShowAnalysis = useCallback((currentHour?: number) => {
    return db.getRunOfShowAnalysis(currentHour);
  }, []);

  const reviewTaskEvidence = useCallback((taskId: string, evidenceId: string, approved: boolean, notes?: string) => {
    const success = db.reviewTaskEvidence(taskId, evidenceId, approved, notes);
    refreshAll();
    showToast(approved ? "Evidence approved. Task marked complete!" : "Changes requested from volunteer.");
    return success;
  }, [refreshAll, showToast]);

  const submitJudgeScore = useCallback((teamId: string, score: Omit<JudgingScore, "submitted_at">) => {
    db.submitJudgeScore(teamId, score);
    refreshAll();
    showToast(`Evaluation submitted for team by ${score.judge_name}. Leaderboard updated.`);
  }, [refreshAll, showToast]);

  const getNormalizedLeaderboard = useCallback((track?: HackathonTrack) => {
    return db.getNormalizedLeaderboard(track);
  }, []);

  const createMentorTicket = useCallback((data: {
    team_name: string;
    table_location: string;
    track: HackathonTrack;
    tech_stack: string[];
    issue_summary: string;
    priority?: "low" | "medium" | "high" | "urgent";
  }) => {
    const ticket = db.createMentorTicket(data);
    refreshAll();
    showToast(`Mentor ticket #${ticket.id.slice(-4)} queued at ${ticket.table_location}.`);
    return ticket;
  }, [refreshAll, showToast]);

  const claimMentorTicket = useCallback((ticketId: string, mentorId: string, mentorName: string) => {
    db.claimMentorTicket(ticketId, mentorId, mentorName);
    refreshAll();
    showToast(`Ticket claimed by ${mentorName}. Dispatched to table!`);
  }, [refreshAll, showToast]);

  const resolveMentorTicket = useCallback((ticketId: string, resolutionNotes?: string) => {
    db.resolveMentorTicket(ticketId, resolutionNotes);
    refreshAll();
    showToast(`Ticket resolved and logged in HelpQ archive.`);
  }, [refreshAll, showToast]);

  const toggleSponsorDeliverable = useCallback((sponsorId: string, deliverableId: string) => {
    db.toggleSponsorDeliverable(sponsorId, deliverableId);
    refreshAll();
    showToast(`Sponsor deliverable status updated.`);
  }, [refreshAll, showToast]);

  return (
    <ClubOpsContext.Provider
      value={{
        currentUser,
        switchUser,
        isAuthenticated,
        isHydrated,
        login,
        loginAsPersona,
        register,
        verifyEmail,
        forgotPassword,
        resetPassword,
        logout,
        users,
        event,
        updateEventDetails,
        revokeAllSessions,
        requestTaskChanges,
        restoreProject,
        freezeProjectChanges,
        suspendUser,
        deactivateUser,
        activateUser,
        tasks,
        refreshTasks: refreshAll,
        createNewTask,
        updateTaskItem,
        deleteTaskItem,
        volunteers,
        meetings,
        actionItems,
        extractActions,
        approveActions,
        documents,
        uploadNewDocument,
        risks,
        triggerRiskAnalysis,
        updateRisk,
        announcements,
        publishAnnouncement,
        notifications,
        markRead,
        auditLogs,
        runAICommand,
        approveTool,
        toastMessage,
        showToast,
        teams,
        teamMembers,
        roleAssignments,
        permissionRequests,
        createTeam,
        updateTeam,
        archiveTeam,
        suspendTeam,
        addTeamMember,
        removeTeamMember,
        transferTeamMember,
        assignTemporaryRole,
        assignActingOrganizer,
        revokeRoleAssignment,
        createPermissionRequest,
        reviewPermissionRequest,
        delegateTask,
        escalateTask,
        resolveTaskBlocker,
        recommendTeam,
        createTeamFromRecommendation,
        projects,
        projectMembers,
        sessions,
        progressReports,
        createProject,
        updateProject,
        archiveProject,
        addProjectMember,
        removeProjectMember,
        createProgressReport,
        acceptTask,
        startTask,
        blockTask,
        submitTaskEvidence,
        completeTask,
        addChecklistItem,
        toggleChecklistItem,
        addTaskComment,
        logTimeEntry,
        breakdownProject,
        rebalanceWorkload,
        applyWorkloadRebalance,
        revokeSession,
        getCriticalPathAnalysis,
        simulateTaskDelay,
        getOptimizedWorkload,
        getHackathonRiskReport,
        getRunOfShowAnalysis,
        reviewTaskEvidence,
        judgingTeams,
        mentorTickets,
        sponsors,
        submitJudgeScore,
        getNormalizedLeaderboard,
        createMentorTicket,
        claimMentorTicket,
        resolveMentorTicket,
        toggleSponsorDeliverable,
      }}
    >
      {children}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border border-indigo-500/40 bg-slate-900/95 px-4 py-3 text-sm text-slate-100 shadow-aiGlow backdrop-blur-md animate-in slide-in-from-bottom-3">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}
    </ClubOpsContext.Provider>
  );
}

export function useClubOps() {
  const context = useContext(ClubOpsContext);
  if (!context) {
    throw new Error("useClubOps must be used within a ClubOpsProvider");
  }
  return context;
}
