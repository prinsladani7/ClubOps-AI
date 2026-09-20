import {
  User,
  UserRole,
  PermissionAction,
  PermissionScope,
  RoleAssignment,
  Team,
  Project,
  ProjectMember,
  Task,
  Event,
} from "@/types";

export interface PermissionContext {
  teamId?: string;
  projectId?: string;
  eventId?: string;
  taskId?: string;
  targetUserId?: string;
  teams?: Team[];
  projects?: Project[];
  projectMembers?: ProjectMember[];
  roleAssignments?: RoleAssignment[];
}

/**
 * Centralized Authorization Engine (Specification Version 1.0, Section 3 & 4)
 * Authorization Model: USER -> ROLE -> SCOPE -> RESOURCE -> ACTION
 *
 * Explicit Permission Matrix:
 * - project:create, project:view_all, project:view, project:update, project:archive
 * - member:add, member:remove
 * - organizer:create, organizer:remove
 * - volunteer:add, volunteer:remove
 * - task:create, task:assign, task:update, task:complete
 * - report:view, report:create
 * - audit:view, settings:manage, session:revoke
 */
export function can(
  user: User | null | undefined,
  action: PermissionAction,
  resource?: any,
  context?: PermissionContext
): boolean {
  if (!user) return false;

  // Account states check:
  // Suspended, deactivated, locked, and pending verification have zero access to operational actions
  if (
    user.status === "suspended" ||
    user.status === "deactivated" ||
    user.status === "locked_temporarily" ||
    user.status === "pending_verification"
  ) {
    return false;
  }

  // 1. ADMIN ROLE: Full organization access (Specification Section 3)
  if (user.role === "admin") {
    return true;
  }

  // 2. CHECK ACTIVE TEMPORARY ROLES & ACTING ORGANIZER (Specification Section 8 & 9)
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
      (!context?.teamId || ra.scope_id === context.teamId) &&
      (!context?.projectId || ra.scope_id === context.projectId)
  );

  const effectiveRole: UserRole = isActingOrganizer ? "organizer" : user.role;

  // 3. ORGANIZER ROLE (Specification Section 3 & 4)
  if (effectiveRole === "organizer") {
    // Prohibited operations for organizers (Vertical Privilege Escalation Prevention):
    if (
      action === "project:create" ||
      action === "project:view_all" ||
      action === "project:archive" ||
      action === "organizer:create" ||
      action === "organizer:remove" ||
      action === "audit:view" ||
      action === "settings:manage" ||
      action === "session:revoke" ||
      // Legacy actions:
      action === "CREATE_TEAM" ||
      action === "ARCHIVE_TEAM" ||
      action === "SUSPEND_TEAM" ||
      action === "ASSIGN_ORGANIZER" ||
      action === "MANAGE_PERMISSIONS" ||
      action === "MANAGE_SETTINGS" ||
      action === "VIEW_AUDIT"
    ) {
      return false;
    }

    // Scoped check for Project operations (Horizontal Privilege Escalation Prevention)
    if (action === "project:view" || action === "project:update") {
      if (resource && (resource as Project).organizer_id) {
        const proj = resource as Project;
        const isAssigned =
          proj.organizer_id === user.id ||
          (proj.organizers && proj.organizers.includes(user.id)) ||
          isActingOrganizer;
        if (!isAssigned) return false;
      } else if (context?.projectId && context?.projects) {
        const proj = context.projects.find((p) => p.id === context.projectId);
        if (
          proj &&
          proj.organizer_id !== user.id &&
          !(proj.organizers && proj.organizers.includes(user.id)) &&
          !isActingOrganizer
        ) {
          return false;
        }
      }
      return true;
    }

    // Scoped check for Member / Volunteer operations
    if (
      action === "member:add" ||
      action === "member:remove" ||
      action === "volunteer:add" ||
      action === "volunteer:remove" ||
      action === "EDIT_TEAM" ||
      action === "ASSIGN_VOLUNTEER" ||
      action === "REMOVE_MEMBER"
    ) {
      // Must match assigned team or project
      if (context?.teamId && context.teams) {
        const team = context.teams.find((t) => t.id === context.teamId);
        if (team && team.organizer_id !== user.id && !isActingOrganizer) {
          return false; // Cross-team unauthorized access denied
        }
      }
      if (context?.projectId && context.projects) {
        const proj = context.projects.find((p) => p.id === context.projectId);
        if (
          proj &&
          proj.organizer_id !== user.id &&
          !(proj.organizers && proj.organizers.includes(user.id)) &&
          !isActingOrganizer
        ) {
          return false; // Cross-project unauthorized access denied
        }
      }
      return true;
    }

    // Scoped check for Tasks
    if (
      action === "task:create" ||
      action === "task:assign" ||
      action === "task:update" ||
      action === "task:complete" ||
      action === "CREATE_TASK" ||
      action === "ASSIGN_TASK" ||
      action === "UPDATE_TASK" ||
      action === "DELEGATE_TASK"
    ) {
      if (resource) {
        const t = resource as Task;
        if (t.team_id && context?.teams) {
          const taskTeam = context.teams.find((tm) => tm.id === t.team_id);
          if (taskTeam && taskTeam.organizer_id !== user.id && !isActingOrganizer) {
            return false;
          }
        }
        if (t.project_id && context?.projects) {
          const taskProj = context.projects.find((pr) => pr.id === t.project_id);
          if (
            taskProj &&
            taskProj.organizer_id !== user.id &&
            !(taskProj.organizers && taskProj.organizers.includes(user.id)) &&
            !isActingOrganizer
          ) {
            return false;
          }
        }
      }
      return true;
    }

    // Reports
    if (action === "report:view" || action === "report:create") {
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

  // 4. VOLUNTEER ROLE (Specification Section 3 & 4)
  if (effectiveRole === "volunteer") {
    // Prohibited operations for volunteers:
    if (
      action === "project:create" ||
      action === "project:view_all" ||
      action === "project:update" ||
      action === "project:archive" ||
      action === "member:add" ||
      action === "member:remove" ||
      action === "organizer:create" ||
      action === "organizer:remove" ||
      action === "volunteer:add" ||
      action === "volunteer:remove" ||
      action === "task:create" ||
      action === "task:assign" ||
      action === "report:create" ||
      action === "audit:view" ||
      action === "settings:manage" ||
      action === "session:revoke" ||
      // Legacy prohibited
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

    // Can only update or complete own assigned tasks
    if (
      action === "task:update" ||
      action === "task:complete" ||
      action === "UPDATE_TASK"
    ) {
      if (resource && (resource as Task).owner_id) {
        return (resource as Task).owner_id === user.id;
      }
      return false;
    }

    // Can view tasks assigned to them or public/team tasks
    if (action === "VIEW_TASK") {
      if (resource && (resource as Task).owner_id) {
        return (resource as Task).owner_id === user.id;
      }
      return true;
    }

    // Scoped project view
    if (action === "project:view") {
      return true;
    }

    // Scoped report view
    if (action === "report:view") {
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
    if (
      action === "project:view" ||
      action === "report:view" ||
      action === "VIEW_EVENT" ||
      action === "REQUEST_PERMISSION"
    ) {
      return true;
    }
    return false;
  }

  return false;
}

/**
 * Route access policy (Specification Section 2 & 15)
 * Enforces authorization boundaries on routes.
 */
export function canAccessRoute(
  user: User | null | undefined,
  pathname: string,
  roleAssignments?: RoleAssignment[]
): boolean {
  // Public routes always accessible
  const publicRoutes = [
    "/auth/role",
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/verify",
    "/login",
  ];

  if (publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "?"))) {
    return true;
  }

  if (!user) {
    return false;
  }

  // Suspended, deactivated, or locked accounts can only visit auth/login
  if (
    user.status === "suspended" ||
    user.status === "deactivated" ||
    user.status === "locked_temporarily"
  ) {
    return pathname === "/auth/login" || pathname === "/login";
  }

  // Pending verification can only access verify or login
  if (user.status === "pending_verification") {
    return pathname === "/auth/verify" || pathname === "/auth/login" || pathname === "/login";
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
    // Prohibited for organizers
    const forbiddenForOrganizer = [
      "/admin",
      "/audit",
      "/settings",
      "/volunteer/profile",
    ];
    if (forbiddenForOrganizer.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
      return false;
    }

    // Organizer specific routes
    if (pathname.startsWith("/organizer")) {
      return true;
    }

    // General operational routes
    return true;
  }

  // Volunteer routes
  if (effectiveRole === "volunteer") {
    // Prohibited for volunteers
    const forbiddenForVolunteer = [
      "/admin",
      "/organizer",
      "/audit",
      "/settings",
      "/dashboard/team-management",
    ];
    if (forbiddenForVolunteer.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
      return false;
    }

    // Volunteer specific routes
    if (pathname.startsWith("/volunteer")) {
      return true;
    }

    // Permitted shared operational routes
    const allowedForVolunteer = [
      "/",
      "/tasks",
      "/calendar",
      "/meetings",
      "/documents",
      "/ai-assistant",
      "/announcements",
      "/login",
      "/war-room",
      "/planning",
      "/algorithms",
    ];
    return allowedForVolunteer.some((route) => pathname === route || pathname.startsWith(route + "/"));
  }

  // Member routes (Public only)
  if (effectiveRole === "member") {
    const allowedForMember = ["/", "/events", "/calendar", "/announcements", "/login", "/war-room", "/planning"];
    return allowedForMember.some((route) => pathname === route || pathname.startsWith(route + "/"));
  }

  return false;
}
