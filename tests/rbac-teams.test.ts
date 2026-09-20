import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { can, canAccessRoute } from "@/lib/permissions";
import { User, Task, RoleAssignment } from "@/types";

describe("RBAC & Hierarchical Team Management Engine (All 17 Scenarios)", () => {
  // Test Personas
  const adminUser: User = {
    id: "usr-prins",
    name: "Prins Patel",
    email: "prins@syntaxsquad.edu",
    role: "admin",
    status: "active",
    created_at: "2026-08-01T00:00:00Z",
  };

  const organizerRahul: User = {
    id: "usr-rahul",
    name: "Rahul Sharma",
    email: "rahul@syntaxsquad.edu",
    role: "organizer",
    status: "active",
    created_at: "2026-08-01T00:00:00Z",
  };

  const organizerJay: User = {
    id: "usr-jay",
    name: "Jay Vora",
    email: "jay@syntaxsquad.edu",
    role: "organizer",
    status: "active",
    created_at: "2026-08-01T00:00:00Z",
  };

  const volunteerAnanya: User = {
    id: "usr-ananya",
    name: "Ananya Iyer",
    email: "ananya@syntaxsquad.edu",
    role: "volunteer",
    status: "active",
    created_at: "2026-08-01T00:00:00Z",
  };

  const volunteerDev: User = {
    id: "usr-dev",
    name: "Dev Malik",
    email: "dev@syntaxsquad.edu",
    role: "volunteer",
    status: "active",
    created_at: "2026-08-01T00:00:00Z",
  };

  beforeEach(() => {
    db.loadDemoData();
    // Reset to Admin persona
    db.setCurrentUser("usr-prins");
  });

  // 1. Admin can create team
  it("Scenario 1: Admin can create team", () => {
    db.setCurrentUser("usr-prins");
    expect(can(adminUser, "CREATE_TEAM")).toBe(true);

    const team = db.createTeam({
      name: "Security Ops Squad",
      description: "Dedicated campus security and perimeter patrol",
      organizer_id: "usr-rahul",
    });

    expect(team).toBeDefined();
    expect(team.name).toBe("Security Ops Squad");
    expect(team.organizer_id).toBe("usr-rahul");
  });

  // 2. Organizer cannot create team
  it("Scenario 2: Organizer cannot create team (fails permission check)", () => {
    expect(can(organizerRahul, "CREATE_TEAM")).toBe(false);

    db.setCurrentUser("usr-rahul");
    expect(() => {
      db.createTeam({
        name: "Unauthorized Team",
        description: "Should fail",
        organizer_id: "usr-rahul",
      });
    }).toThrow(/Unauthorized/);
  });

  // 3. Volunteer cannot create team
  it("Scenario 3: Volunteer cannot create team", () => {
    expect(can(volunteerAnanya, "CREATE_TEAM")).toBe(false);

    db.setCurrentUser("usr-ananya");
    expect(() => {
      db.createTeam({
        name: "Volunteer Squad",
        description: "Should fail",
        organizer_id: "usr-ananya",
      });
    }).toThrow(/Unauthorized/);
  });

  // 4. Organizer can edit own team
  it("Scenario 4: Organizer can edit own team", () => {
    const teams = db.getTeams();
    const techOpsTeam = teams.find((t) => t.id === "team-tech-ops");
    expect(techOpsTeam).toBeDefined();
    expect(techOpsTeam?.organizer_id).toBe("usr-jay");

    const allowed = can(organizerJay, "EDIT_TEAM", techOpsTeam, {
      teamId: "team-tech-ops",
      teams,
    });
    expect(allowed).toBe(true);
  });

  // 5. Organizer cannot edit other team (cross-team permission denial)
  it("Scenario 5: Organizer cannot edit other team (cross-team denial)", () => {
    const teams = db.getTeams();
    const stageAvTeam = teams.find((t) => t.id === "team-stage-av");
    expect(stageAvTeam?.organizer_id).toBe("usr-priya");

    const allowed = can(organizerJay, "EDIT_TEAM", stageAvTeam, {
      teamId: "team-stage-av",
      teams,
    });
    expect(allowed).toBe(false);
  });

  // 6. Admin can assign any role
  it("Scenario 6: Admin can assign any role", () => {
    expect(can(adminUser, "MANAGE_PERMISSIONS")).toBe(true);
    expect(can(adminUser, "ASSIGN_ORGANIZER")).toBe(true);

    const ra = db.assignTemporaryRole({
      user_id: "usr-dev",
      role: "DATABASE_LEAD",
      scope_type: "team",
      scope_id: "team-tech-ops",
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    });

    expect(ra.id).toBeDefined();
    expect(ra.role).toBe("DATABASE_LEAD");
  });

  // 7. Organizer cannot promote anyone to Admin
  it("Scenario 7: Organizer cannot promote anyone to Admin", () => {
    expect(can(organizerRahul, "ASSIGN_ORGANIZER")).toBe(false);
    expect(can(organizerRahul, "MANAGE_PERMISSIONS")).toBe(false);
  });

  // 8. Volunteer cannot assign tasks to other volunteers
  it("Scenario 8: Volunteer cannot assign tasks to other volunteers", () => {
    expect(can(volunteerAnanya, "ASSIGN_TASK")).toBe(false);
  });

  // 9. Volunteer can update own assigned task
  it("Scenario 9: Volunteer can update own assigned task", () => {
    const ownTask: Task = {
      id: "task-test-own",
      event_id: "event-01",
      title: "Develop Frontend Portal",
      description: "Next.js frontend development",
      owner_id: "usr-ananya",
      status: "todo",
      priority: "high",
      due_at: "2026-09-30T00:00:00Z",
      created_by: "usr-prins",
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-09-01T00:00:00Z",
    };

    expect(can(volunteerAnanya, "UPDATE_TASK", ownTask)).toBe(true);
  });

  // 10. Volunteer cannot update another volunteer's task
  it("Scenario 10: Volunteer cannot update another volunteer's task", () => {
    const othersTask: Task = {
      id: "task-test-other",
      event_id: "event-01",
      title: "Audio Rigging Setup",
      description: "Rigging trusses and fixtures",
      owner_id: "usr-rahul",
      status: "todo",
      priority: "critical",
      due_at: "2026-09-30T00:00:00Z",
      created_by: "usr-prins",
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-09-01T00:00:00Z",
    };

    expect(can(volunteerAnanya, "UPDATE_TASK", othersTask)).toBe(false);
  });

  // 11. Task delegation creates valid delegation chain and updates owner
  it("Scenario 11: Task delegation creates valid delegation chain and updates owner", () => {
    db.setCurrentUser("usr-prins");
    const task = db.createTask({
      event_id: "event-techfest-2026",
      title: "Deploy Check-in QR Gateways",
      description: "Hardware network terminals for entry validation",
      owner_id: "usr-dev",
      status: "todo",
      priority: "high",
      due_at: "2026-09-28T18:00:00Z",
      created_by: "usr-prins",
    });

    const delegated = db.delegateTask(task.id, "usr-ananya", "Dev reallocated to backend failover");
    expect(delegated).toBeDefined();
    expect(delegated?.owner_id).toBe("usr-ananya");
    expect(delegated?.delegation_chain).toBeDefined();
    expect(delegated?.delegation_chain?.length).toBe(1);
    expect(delegated?.delegation_chain?.[0].to_user_id).toBe("usr-ananya");
    expect(delegated?.delegation_chain?.[0].reason).toContain("Dev reallocated");
  });

  // 12. Delegation by non-owner / non-organizer / non-admin is rejected
  it("Scenario 12: Delegation by non-owner / unauthorized volunteer is rejected", () => {
    const testTask = db.createTask({
      event_id: "event-techfest-2026",
      title: "Private Audio Calibration",
      description: "Audio frequency sweep test",
      owner_id: "usr-rahul",
      status: "todo",
      priority: "high",
      due_at: "2026-09-28T18:00:00Z",
      created_by: "usr-rahul",
    });

    // Volunteer Ananya is neither owner nor organizer nor admin
    db.setCurrentUser("usr-ananya");
    expect(() => {
      db.delegateTask(testTask.id, "usr-dev", "Unauthorized handoff");
    }).toThrow(/Unauthorized/);
  });

  // 13. Temporary event role grants permissions within validity window
  it("Scenario 13: Temporary event role grants permissions within validity window", () => {
    const activeRole: RoleAssignment = {
      id: "ra-active",
      user_id: "usr-ananya",
      role: "ACTING_ORGANIZER",
      scope_type: "team",
      scope_id: "team-tech-ops",
      starts_at: new Date(Date.now() - 3600000).toISOString(), // 1 hr ago
      expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hr in future
      status: "active",
      granted_by: "usr-prins",
      created_at: new Date().toISOString(),
    };

    const hasClearance = can(volunteerAnanya, "EDIT_TEAM", undefined, {
      teamId: "team-tech-ops",
      roleAssignments: [activeRole],
    });

    expect(hasClearance).toBe(true);
  });

  // 14. Temporary event role does not grant permissions after expiration
  it("Scenario 14: Temporary event role does not grant permissions after expiration", () => {
    const expiredRole: RoleAssignment = {
      id: "ra-expired",
      user_id: "usr-ananya",
      role: "ACTING_ORGANIZER",
      scope_type: "team",
      scope_id: "team-tech-ops",
      starts_at: new Date(Date.now() - 7200000).toISOString(), // 2 hrs ago
      expires_at: new Date(Date.now() - 3600000).toISOString(), // 1 hr ago (expired)
      status: "active",
      granted_by: "usr-prins",
      created_at: new Date().toISOString(),
    };

    const hasClearance = can(volunteerAnanya, "EDIT_TEAM", undefined, {
      teamId: "team-tech-ops",
      roleAssignments: [expiredRole],
    });

    expect(hasClearance).toBe(false);
  });

  // 15. Acting organizer role grants organizer permissions for the designated team until expired
  it("Scenario 15: Acting organizer role grants organizer permissions for the designated team", () => {
    db.setCurrentUser("usr-prins");
    const actingOrg = db.assignActingOrganizer("team-stage-av", "usr-ananya", 24);

    expect(actingOrg).toBeDefined();
    expect(actingOrg.role).toBe("ACTING_ORGANIZER");

    // Check route access as well
    const canAccessTeams = canAccessRoute(volunteerAnanya, "/dashboard/team-management", [actingOrg]);
    expect(canAccessTeams).toBe(true);
  });

  // 16. Permission request can be approved, rejected, or temporarily approved
  it("Scenario 16: Permission request can be created and reviewed", () => {
    db.setCurrentUser("usr-ananya");
    const req = db.createPermissionRequest({
      permission: "APPROVE_AI_ACTION",
      scope_type: "team",
      scope_id: "team-stage-av",
      resource_type: "task",
      reason: "Emergency AV sign-off needed for soundcheck",
    });

    expect(req).toBeDefined();
    expect(req.status).toBe("pending");

    // Admin reviews and temporarily approves for 12 hours
    db.setCurrentUser("usr-prins");
    const reviewed = db.reviewPermissionRequest(req.id, "temporarily_approve", 12, "Approved for duration of sound check");

    expect(reviewed?.status).toBe("temporarily_approved");
    expect(reviewed?.expires_at).toBeDefined();
    expect(reviewed?.reviewer_id).toBe("usr-prins");
  });

  // 17. Emergency escalation updates blocked task, escalation level, and notifies target
  it("Scenario 17: Emergency escalation updates blocked task and elevates level", () => {
    db.setCurrentUser("usr-prins");
    const task = db.createTask({
      event_id: "event-techfest-2026",
      title: "Audio Snake Cable Routing",
      description: "Routing audio cables under stage riser",
      owner_id: "usr-rahul",
      status: "in_progress",
      priority: "high",
      due_at: "2026-09-26T12:00:00Z",
      created_by: "usr-rahul",
    });

    // Level 1: Volunteer escalates to Organizer
    db.setCurrentUser("usr-rahul");
    const esc1 = db.escalateTask(task.id, "Cable conduit blocked by facility construction");

    expect(esc1).toBeDefined();
    expect(esc1?.status).toBe("blocked");
    expect(esc1?.escalation_level).toBe("organizer");
    expect(esc1?.blocked_at).toBeDefined();

    // Level 2: Organizer escalates to Admin
    const esc2 = db.escalateTask(task.id, "Facility management refusing entry without Dean permit");
    expect(esc2?.escalation_level).toBe("admin");
    expect(esc2?.escalated_to).toBe("usr-prins");

    // Level 3: Admin resolves blocker
    db.setCurrentUser("usr-prins");
    const resolved = db.resolveTaskBlocker(task.id, "Dean permit granted and sent via official email");
    expect(resolved?.status).toBe("in_progress");
    expect(resolved?.escalation_level).toBeUndefined();
    expect(resolved?.resolution_status).toBe("resolved");
  });
});
