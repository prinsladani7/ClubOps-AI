"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  User,
  Event,
  Task,
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
} from "@/types";
import { db } from "@/lib/db";
import { aiProvider } from "@/lib/ai/provider";

interface ClubOpsContextType {
  currentUser: User;
  switchUser: (userId: string) => void;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginAsPersona: (userId: string) => void;
  register: (name: string, email: string, role: UserRole, password?: string) => Promise<{ success: boolean; error?: string }>;
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
}

const ClubOpsContext = createContext<ClubOpsContextType | undefined>(undefined);

export function ClubOpsProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(() => db.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("clubops_auth");
      return stored !== null ? stored === "true" : true;
    }
    return true;
  });
  const [users, setUsers] = useState<User[]>(() => db.getUsers());
  const [event, setEvent] = useState<Event>(() => db.getEvent());
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const refreshAll = useCallback(() => {
    setCurrentUser(db.getCurrentUser());
    setUsers(db.getUsers());
    setEvent(db.getEvent());
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

  const login = useCallback(async (email: string, password?: string) => {
    const user = db.getUserByEmail(email);
    if (!user) {
      return { success: false, error: "No account found matching this email address. Please try demo personas or register." };
    }
    db.setCurrentUser(user.id);
    setCurrentUser(user);
    setIsAuthenticated(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("clubops_auth", "true");
      localStorage.setItem("clubops_user_id", user.id);
    }
    refreshAll();
    showToast(`Signed in successfully as ${user.name}.`);
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

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("clubops_auth", "false");
    }
    showToast("You have been signed out.");
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

  return (
    <ClubOpsContext.Provider
      value={{
        currentUser,
        switchUser,
        isAuthenticated,
        login,
        loginAsPersona,
        register,
        logout,
        users,
        event,
        updateEventDetails,
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
