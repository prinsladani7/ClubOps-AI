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
} from "@/types";
import { db } from "@/lib/db";
import { aiProvider } from "@/lib/ai/provider";

interface ClubOpsContextType {
  currentUser: User;
  switchUser: (userId: string) => void;
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
}

const ClubOpsContext = createContext<ClubOpsContextType | undefined>(undefined);

export function ClubOpsProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(() => db.getCurrentUser());
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
  }, []);

  const switchUser = useCallback((userId: string) => {
    const user = db.setCurrentUser(userId);
    setCurrentUser(user);
    refreshAll();
    showToast(`Switched active persona to ${user.name} (${user.role.toUpperCase()})`);
  }, [refreshAll, showToast]);

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

  return (
    <ClubOpsContext.Provider
      value={{
        currentUser,
        switchUser,
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
