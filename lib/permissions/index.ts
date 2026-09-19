import {
  User,
  UserRole,
  PermissionAction,
  PermissionScope,
  RoleAssignment,
  Team,
  Task,
  Event,
} from "@/types";

export interface PermissionContext {
  teamId?: string;
  eventId?: string;
  taskId?: string;
  targetUserId?: string;
  teams?: Team[];
  roleAssignments?: RoleAssignment[];
}

/**
 * Centralized Authorization Engine (Section 4 & 18)
 * Authorization Model: USER -> ROLE -> SCOPE -> RESOURCE -> ACTION
 * Never rely on frontend visibility for authorization.
 */
export function can(
  user: User | null | undefined,
  action: PermissionAction,
  resource?: any,
  context?: PermissionContext
): boolean {
  if (!user) return false;

  // Suspended users have zero authorization
  if (user.status === "suspended") {
    return false;
  }

  // 1. ADMIN ROLE: Full organization access (Section 3)
  if (user.role === "admin") {
    return true;
  }

  // 2. CHECK ACTIVE TEMPORARY ROLES & ACTING ORGANIZER (Section 8 & 9)
  const now = new Date();
  const activeAssignments = (context?.roleAssignments || []).filter(
    (ra) =>
      ra.user_id === user.id &&
      ra.status === "active" &&
      new Date(ra.starts_at) <= now &&
      new Date(ra.expires_at) > now
  );

  const isActingOrganizer = activeAssignments.some(
    (ra) =>
      ra.role === "ACTING_ORGANIZER" &&
      (!context?.teamId || ra.scope_id === context.teamId)
  );

  const effectiveRole: UserRole = isActingOrganizer ? "organizer" : user.role;

  // 3. ORGANIZER ROLE (Section 3 & 18)
  if (effectiveRole === "organizer") {
    // Prohibited operations for organizers:
    if (
      action === "CREATE_TEAM" || // Only Admin creates teams in core hierarchy
      action === "ARCHIVE_TEAM" ||
      action === "SUSPEND_TEAM" ||
      action === "ASSIGN_ORGANIZER" ||
      action === "MANAGE_PERMISSIONS" ||
      action === "MANAGE_SETTINGS" ||
      action === "VIEW_AUDIT"
    ) {
      return false;
    }

    // Scoped check for Team operations
    if (action === "EDIT_TEAM" || action === "ASSIGN_VOLUNTEER" || action === "REMOVE_MEMBER") {
      // Must match assigned team
      if (context?.teamId && context.teams) {
        const team = context.teams.find((t) => t.id === context.teamId);
        if (team && team.organizer_id !== user.id && !isActingOrganizer) {
          return false; // Cross-team unauthorized access denied
        }
      }
      return true;
    }

    // Scoped check for Tasks
    if (action === "CREATE_TASK" || action === "ASSIGN_TASK" || action === "UPDATE_TASK" || action === "DELEGATE_TASK") {
      if (resource && (resource as Task).team_id && context?.teams) {
        const taskTeam = context.teams.find((t) => t.id === (resource as Task).team_id);
        if (taskTeam && taskTeam.organizer_id !== user.id && !isActingOrganizer) {
          return false;
        }
      }
      return true;
    }

    // Organizers can view team, events, tasks, escalate tasks, request permissions
    if (
      action === "VIEW_TEAM" ||
      action === "VIEW_EVENT" ||
      action === "VIEW_TASK" ||
      action === "ESCALATE_TASK" ||
      action === "REQUEST_PERMISSION" ||
      action === "APPROVE_PERMISSION" ||
      action === "APPROVE_AI_ACTION"
    ) {
      return true;
    }

    return false;
  }

  // 4. VOLUNTEER ROLE (Section 3 & 18)
  if (effectiveRole === "volunteer") {
    // Cannot manage users, permissions, teams, or assign tasks to others
    if (
      action === "CREATE_TEAM" ||
      action === "EDIT_TEAM" ||
      action === "ARCHIVE_TEAM" ||
      action === "SUSPEND_TEAM" ||
      action === "ASSIGN_ORGANIZER" ||
      action === "ASSIGN_VOLUNTEER" ||
      action === "REMOVE_MEMBER" ||
      action === "ASSIGN_TASK" ||
      action === "DELEGATE_TASK" ||
      action === "CREATE_EVENT" ||
      action === "EDIT_EVENT" ||
      action === "MANAGE_PERMISSIONS" ||
      action === "APPROVE_PERMISSION" ||
      action === "APPROVE_AI_ACTION" ||
      action === "MANAGE_SETTINGS" ||
      action === "VIEW_AUDIT"
    ) {
      return false;
    }

    // Can update own assigned tasks, report blockers, escalate tasks
    if (action === "UPDATE_TASK" || action === "VIEW_TASK") {
      if (resource && (resource as Task).owner_id) {
        // Can view or update if assigned to this volunteer
        return (resource as Task).owner_id === user.id;
      }
      return true;
    }

    if (
      action === "ESCALATE_TASK" ||
      action === "REQUEST_PERMISSION" ||
      action === "VIEW_EVENT" ||
      action === "VIEW_TEAM"
    ) {
      return true;
    }

    return false;
  }

  // 5. MEMBER ROLE
  if (user.role === "member") {
    if (action === "VIEW_EVENT" || action === "REQUEST_PERMISSION") {
      return true;
    }
    return false;
  }

  return false;
}

/**
 * Route access policy (Section 15)
 * Enforces authorization on routes rather than only hiding navigation links.
 */
export function canAccessRoute(
  user: User | null | undefined,
  pathname: string,
  roleAssignments?: RoleAssignment[]
): boolean {
  if (!user) {
    return pathname === "/login";
  }

  if (user.status === "suspended") {
    return pathname === "/login";
  }

  // Admin has access to all routes
  if (user.role === "admin") {
    return true;
  }

  // Check active acting organizer or temporary roles
  const now = new Date();
  const isActingOrganizer = (roleAssignments || []).some(
    (ra) =>
      ra.user_id === user.id &&
      ra.role === "ACTING_ORGANIZER" &&
      ra.status === "active" &&
      new Date(ra.starts_at) <= now &&
      new Date(ra.expires_at) > now
  );

  const effectiveRole: UserRole = isActingOrganizer ? "organizer" : user.role;

  // Organizer routes
  if (effectiveRole === "organizer") {
    const forbiddenForOrganizer = ["/audit", "/settings"];
    return !forbiddenForOrganizer.some((route) => pathname.startsWith(route));
  }

  // Volunteer routes
  if (effectiveRole === "volunteer") {
    const allowedForVolunteer = [
      "/",
      "/tasks",
      "/calendar",
      "/meetings",
      "/documents",
      "/ai-assistant",
      "/announcements",
      "/login",
    ];
    return allowedForVolunteer.some((route) => pathname === route || pathname.startsWith(route + "/"));
  }

  // Member routes (Public only)
  if (effectiveRole === "member") {
    const allowedForMember = ["/", "/events", "/calendar", "/announcements", "/login"];
    return allowedForMember.some((route) => pathname === route || pathname.startsWith(route + "/"));
  }

  return false;
}
