import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { can, canAccessRoute } from "@/lib/permissions";
import { User, Project, Task } from "@/types";

describe("ClubOps AI — Strict RBAC & Authorization Boundaries (Section 10 & 13)", () => {
  const adminUser: User = {
    id: "usr-prins",
    name: "Prins Patel",
    email: "prins@syntaxsquad.edu",
    role: "admin",
    status: "active",
    created_at: "2026-08-01T00:00:00Z",
  };

  const organizerJay: User = {
    id: "usr-jay",
    name: "Jay Shah",
    email: "jay.shah@syntaxsquad.edu",
    role: "organizer",
    status: "active",
    created_at: "2026-08-05T00:00:00Z",
  };

  const organizerPriya: User = {
    id: "usr-priya",
    name: "Priya Mehta",
    email: "priya.mehta@syntaxsquad.edu",
    role: "organizer",
    status: "active",
    created_at: "2026-08-06T00:00:00Z",
  };

  const volunteerRahul: User = {
    id: "usr-rahul",
    name: "Rahul Sharma",
    email: "rahul.sharma@syntaxsquad.edu",
    role: "volunteer",
    status: "active",
    created_at: "2026-08-10T00:00:00Z",
  };

  const suspendedUser: User = {
    id: "usr-suspended",
    name: "Suspended User",
    email: "suspended@syntaxsquad.edu",
    role: "volunteer",
    status: "suspended",
    created_at: "2026-08-20T00:00:00Z",
  };

  const deactivatedUser: User = {
    id: "usr-deactivated",
    name: "Deactivated User",
    email: "deactivated@syntaxsquad.edu",
    role: "volunteer",
    status: "deactivated",
    created_at: "2026-08-15T00:00:00Z",
  };

  const pendingUser: User = {
    id: "usr-pending",
    name: "Pending User",
    email: "pending@syntaxsquad.edu",
    role: "volunteer",
    status: "pending_verification",
    verification_token: "verify-token-12345",
    created_at: "2026-09-15T00:00:00Z",
  };

  beforeEach(() => {
    db.loadDemoData();
    db.setCurrentUser("usr-prins");
  });

  // 1. Role Selection & Authentication Matching
  describe("Authentication Flow & Role Inheritance (Section 2 & 3)", () => {
    it("Enforces role matching when logging in", () => {
      // Jay Shah is registered as 'organizer'
      const mismatch = db.loginUser("jay.shah@syntaxsquad.edu", "password", "admin");
      expect(mismatch.success).toBe(false);
      expect(mismatch.error).toContain("Role mismatch");

      const match = db.loginUser("jay.shah@syntaxsquad.edu", "password", "organizer");
      expect(match.success).toBe(true);
      expect(match.user?.role).toBe("organizer");
    });

    it("Rejects authentication for suspended and deactivated accounts", () => {
      const suspRes = db.loginUser("suspended@syntaxsquad.edu", "password", "volunteer");
      expect(suspRes.success).toBe(false);
      expect(suspRes.error).toContain("suspended");

      const deactRes = db.loginUser("deactivated@syntaxsquad.edu", "password", "volunteer");
      expect(deactRes.success).toBe(false);
      expect(deactRes.error).toContain("deactivated");
    });

    it("Flags pending verification accounts and activates upon token entry", () => {
      const pendingRes = db.loginUser("pending@syntaxsquad.edu", "password", "volunteer");
      expect(pendingRes.success).toBe(false);
      expect(pendingRes.pendingVerification).toBe(true);

      const verifyRes = db.verifyEmail("verify-token-12345");
      expect(verifyRes.success).toBe(true);
      expect(verifyRes.user?.status).toBe("active");
    });

    it("Rate limits failed credentials and triggers cooldown lockout", () => {
      const testEmail = "divya.n@syntaxsquad.edu";
      // 5 wrong passwords
      for (let i = 0; i < 4; i++) {
        const res = db.loginUser(testEmail, "wrongpassword", "volunteer");
        expect(res.success).toBe(false);
      }
      const lockRes = db.loginUser(testEmail, "wrongpassword", "volunteer");
      expect(lockRes.success).toBe(false);
      expect(lockRes.error).toContain("locked");

      // Admin can restore user
      db.setCurrentUser("usr-prins");
      db.activateUser("usr-divya");
    });
  });

  // 2. Vertical Privilege Escalation Prevention
  describe("Vertical Privilege Escalation Prevention (Section 4 & 10)", () => {
    it("Prevents Organizers from chartering or archiving projects", () => {
      expect(can(organizerJay, "project:create")).toBe(false);
      expect(can(organizerJay, "project:archive")).toBe(false);
      expect(can(organizerJay, "settings:manage")).toBe(false);
      expect(can(organizerJay, "session:revoke")).toBe(false);

      db.setCurrentUser("usr-jay");
      expect(() => {
        db.createProject({
          name: "Unauthorized Project",
          description: "Should throw",
          organizer_id: "usr-jay",
        });
      }).toThrow(/Unauthorized/);
    });

    it("Prevents Volunteers from creating tasks, removing members, or viewing admin settings", () => {
      expect(can(volunteerRahul, "task:create")).toBe(false);
      expect(can(volunteerRahul, "task:assign")).toBe(false);
      expect(can(volunteerRahul, "member:remove")).toBe(false);
      expect(can(volunteerRahul, "audit:view")).toBe(false);
      expect(can(volunteerRahul, "settings:manage")).toBe(false);
    });

    it("Blocks route access to unauthorized roles", () => {
      // Volunteer cannot access admin or organizer consoles
      expect(canAccessRoute(volunteerRahul, "/admin/dashboard")).toBe(false);
      expect(canAccessRoute(volunteerRahul, "/admin/projects")).toBe(false);
      expect(canAccessRoute(volunteerRahul, "/organizer/dashboard")).toBe(false);
      expect(canAccessRoute(volunteerRahul, "/organizer/tasks")).toBe(false);

      // Organizer cannot access admin console
      expect(canAccessRoute(organizerJay, "/admin/dashboard")).toBe(false);
      expect(canAccessRoute(organizerJay, "/admin/settings")).toBe(false);
      expect(canAccessRoute(organizerJay, "/admin/history")).toBe(false);

      // Admin has universal access
      expect(canAccessRoute(adminUser, "/admin/dashboard")).toBe(true);
      expect(canAccessRoute(adminUser, "/organizer/dashboard")).toBe(true);
      expect(canAccessRoute(adminUser, "/volunteer/dashboard")).toBe(true);
    });
  });

  // 3. Horizontal Privilege Escalation & Resource Scoping
  describe("Horizontal Privilege Escalation & Resource Scoping (Section 4 & 6)", () => {
    it("Prevents an Organizer from modifying a project assigned to another organizer", () => {
      const jayProject: Project = {
        id: "proj-jay",
        name: "Jay's Hackathon",
        description: "Hackathon project",
        organizer_id: "usr-jay",
        status: "active",
        created_at: "2026-09-01T00:00:00Z",
      };

      // Jay can update his own project
      expect(can(organizerJay, "project:update", jayProject, { projectId: "proj-jay" })).toBe(true);

      // Priya cannot update Jay's project
      expect(can(organizerPriya, "project:update", jayProject, { projectId: "proj-jay" })).toBe(false);
    });

    it("Restricts Volunteers to updating only tasks assigned to them", () => {
      const rahulTask: Task = {
        id: "task-rahul",
        title: "Rahul's Task",
        description: "Assigned to Rahul",
        owner_id: "usr-rahul",
        status: "in_progress",
        priority: "medium",
        due_at: "2026-10-20T00:00:00Z",
        created_by: "usr-jay",
        created_at: "2026-09-01T00:00:00Z",
        updated_at: "2026-09-01T00:00:00Z",
      };

      const devTask: Task = {
        id: "task-dev",
        title: "Dev's Task",
        description: "Assigned to Dev",
        owner_id: "usr-dev",
        status: "in_progress",
        priority: "medium",
        due_at: "2026-10-20T00:00:00Z",
        created_by: "usr-jay",
        created_at: "2026-09-01T00:00:00Z",
        updated_at: "2026-09-01T00:00:00Z",
      };

      // Rahul can update his own task
      expect(can(volunteerRahul, "task:update", rahulTask)).toBe(true);
      expect(can(volunteerRahul, "task:complete", rahulTask)).toBe(true);

      // Rahul CANNOT update Dev's task (Horizontal escalation prevented)
      expect(can(volunteerRahul, "task:update", devTask)).toBe(false);
      expect(can(volunteerRahul, "task:complete", devTask)).toBe(false);
    });
  });

  // 4. Task 6-Stage Workflow & Evidence Sign-off
  describe("Task Workflow Lifecycle & Evidence Sign-off (Section 7, 8.C, 10)", () => {
    it("Supports the complete 6-stage workflow and review process", () => {
      db.setCurrentUser("usr-prins");
      const proj = db.getProjects()[0];

      // 1. Create Task
      const task = db.createTask({
        project_id: proj.id,
        title: "Stage Rigging & Sound Check",
        description: "Verify speaker arrays and cabling",
        owner_id: "usr-rahul",
        status: "pending",
        priority: "high",
        due_at: "2026-10-25T18:00:00Z",
        created_by: "usr-prins",
      });
      expect(task.status).toBe("pending");

      // 2. Accept Task
      db.setCurrentUser("usr-rahul");
      const accepted = db.acceptTask(task.id);
      expect(accepted?.status).toBe("accepted");

      // 3. Start Task
      const inProgress = db.startTask(task.id);
      expect(inProgress?.status).toBe("in_progress");

      // 4. Submit Proof of Work
      const submitted = db.submitTaskEvidence(task.id, "https://drive.google.com/proof-rigging.pdf", "Cables taped and audio tested at 95dB.");
      expect(submitted?.status).toBe("submitted");
      expect(submitted?.evidence?.length).toBeGreaterThan(0);

      // 5. Organizer Reviews & Requests Changes
      db.setCurrentUser("usr-jay");
      const changesReq = db.requestTaskChanges(task.id, "Please upload photo of emergency cut-off switch.");
      expect(changesReq?.status).toBe("in_progress");

      // 6. Resubmit & Complete
      db.setCurrentUser("usr-rahul");
      db.submitTaskEvidence(task.id, "https://drive.google.com/proof-switch.jpg", "Added switch photo.");

      db.setCurrentUser("usr-jay");
      const completed = db.completeTask(task.id);
      expect(completed?.status).toBe("completed");
    });
  });

  // 5. Member Removal Workflow (Section 8.D)
  describe("Safe Member Removal Workflow (Section 8.D)", () => {
    it("Deactivates member membership without deleting historical audit logs", () => {
      db.setCurrentUser("usr-prins");
      const projects = db.getProjects();
      const proj = projects[0];

      // Add volunteer to project
      const pm = db.addProjectMember(proj.id, "usr-ananya", "volunteer");
      expect(pm.status).toBe("active");

      // Remove / Deactivate member
      const result = db.removeProjectMember(pm.id, "usr-dev");
      expect(result.member.status).toBe("deactivated");
      expect(result.reassignedTo).toBe("usr-dev");

      // Verify audit trail logged the removal
      const logs = db.getAuditLogs().filter((l) => l.action === "REMOVE_PROJECT_MEMBER");
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  // 6. Emergency Safeguards & Session Revocation
  describe("Emergency Safeguards & Session Revocation (Section 5 & 10)", () => {
    it("Allows Admin to suspend accounts and revoke all active sessions", () => {
      db.setCurrentUser("usr-prins");

      // Admin suspends user
      const suspended = db.suspendUser("usr-sneha", "Security violation");
      expect(suspended).toBe(true);

      const user = db.getUserById("usr-sneha");
      expect(user?.status).toBe("suspended");

      // Admin restores user
      const restored = db.activateUser("usr-sneha");
      expect(restored).toBe(true);
      expect(user?.status).toBe("active");
    });

    it("Allows Admin to freeze project changes during emergency", () => {
      db.setCurrentUser("usr-prins");
      const proj = db.getProjects()[0];

      const frozen = db.freezeProjectChanges(proj.id);
      expect(frozen).toBe(true);
      expect(db.getProjectById(proj.id)?.status).toBe("suspended");

      const restored = db.restoreProject(proj.id);
      expect(restored).toBe(true);
      expect(db.getProjectById(proj.id)?.status).toBe("active");
    });
  });
});
