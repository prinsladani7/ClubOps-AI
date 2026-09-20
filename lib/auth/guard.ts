import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { can, PermissionContext } from "@/lib/permissions";
import { User, PermissionAction, UserSession } from "@/types";

export interface AuthGuardResult {
  authorized: boolean;
  user?: User;
  session?: UserSession;
  response?: NextResponse;
}

// In-memory rate limiting tracker: ip/endpoint -> attempts & reset time
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxAttempts) {
    return false;
  }

  entry.count += 1;
  return true;
}

/**
 * Extracts and authenticates the user from the incoming request.
 * Checks session validity, account state (active, suspended, deactivated, locked, pending_verification).
 */
export function getAuthenticatedUser(request: Request): { user: User; session?: UserSession; error?: string; status?: number } {
  const authHeader = request.headers.get("authorization");
  const headerUserId = request.headers.get("x-user-id");
  let user: User | undefined;
  let session: UserSession | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const sessions = db.getUserSessions();
    session = sessions.find((s) => s.token === token && !s.revoked && new Date(s.expires_at) > new Date());
    if (session) {
      user = db.getUserById(session.user_id);
    }
  }

  if (!user && headerUserId) {
    user = db.getUserById(headerUserId);
  }

  // Fallback to active DB store persona for mock/dev environment
  if (!user) {
    user = db.getCurrentUser();
  }

  if (!user) {
    return { error: "Authentication required", status: 401, user: undefined as any };
  }

  // Account State Checks (Specification Section 3 & 10)
  if (user.status === "suspended") {
    return { error: "Access Denied: Account is suspended by administration.", status: 403, user };
  }
  if (user.status === "deactivated") {
    return { error: "Access Denied: Account is deactivated.", status: 403, user };
  }
  if (user.status === "locked_temporarily") {
    return { error: "Access Denied: Account is temporarily locked due to excessive failed attempts.", status: 423, user };
  }
  if (user.status === "pending_verification") {
    return { error: "Verification Required: Please verify your campus email.", status: 403, user };
  }

  return { user, session };
}

/**
 * Strict server-side RBAC + Resource Scope Authorization Guard
 * Use this in every protected API route.
 */
export function requirePermission(
  request: Request,
  action: PermissionAction,
  resource?: any,
  context?: PermissionContext
): AuthGuardResult {
  const authResult = getAuthenticatedUser(request);

  if (authResult.error || !authResult.user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: authResult.error || "Authentication required" }, { status: authResult.status || 401 }),
    };
  }

  const { user, session } = authResult;

  // Evaluate permission matrix with resource scoping
  const isAllowed = can(user, action, resource, {
    teams: db.getTeams(),
    projects: db.getProjects(),
    projectMembers: context?.projectId ? db.getProjectMembers(context.projectId) : undefined,
    roleAssignments: db.getRoleAssignments(),
    ...context,
  });

  if (!isAllowed) {
    // Log immutable security violation
    db.addAuditLog({
      actor_user_id: user.id,
      actor_type: "user",
      action: "UNAUTHORIZED_API_ATTEMPT",
      entity_type: "api_permission",
      entity_id: action,
      metadata_json: {
        action,
        userRole: user.role,
        userName: user.name,
        context: context || null,
        url: request.url,
      },
    });

    return {
      authorized: false,
      user,
      session,
      response: NextResponse.json(
        {
          error: `Clearance Denied: Role '${user.role.toUpperCase()}' does not possess clearance for action '${action}' within requested resource scope.`,
          code: "FORBIDDEN_INSUFFICIENT_CLEARANCE",
          action,
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user,
    session,
  };
}
