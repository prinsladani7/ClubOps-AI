import { describe, it, expect, beforeEach } from "vitest";
import { safeStorage } from "@/lib/utils/storage";
import { db } from "@/lib/db";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

describe("Error Proofing & Resilience Test Suite", () => {
  describe("1. SafeStorage Resilience", () => {
    it("should safely handle reading, writing, and removing items in node environment", () => {
      expect(() => {
        safeStorage.setItem("test_key", "test_val");
        safeStorage.getItem("test_key");
        safeStorage.removeItem("test_key");
        safeStorage.clear();
      }).not.toThrow();
    });

    it("should never throw when localStorage throws an exception (simulating private/incognito mode)", () => {
      const originalLocalStorage = global.localStorage;
      // Mock localStorage throwing SecurityError
      Object.defineProperty(global, "localStorage", {
        value: {
          getItem: () => {
            throw new Error("SecurityError: Access is denied for this document");
          },
          setItem: () => {
            throw new Error("QuotaExceededError: Storage quota exceeded");
          },
          removeItem: () => {
            throw new Error("SecurityError: Access is denied");
          },
          clear: () => {
            throw new Error("SecurityError: Access is denied");
          },
        },
        configurable: true,
      });

      expect(() => safeStorage.getItem("any_key")).not.toThrow();
      expect(safeStorage.getItem("any_key")).toBeNull();

      expect(() => safeStorage.setItem("any_key", "val")).not.toThrow();
      expect(safeStorage.setItem("any_key", "val")).toBe(false);

      expect(() => safeStorage.removeItem("any_key")).not.toThrow();
      expect(safeStorage.removeItem("any_key")).toBe(false);

      expect(() => safeStorage.clear()).not.toThrow();
      expect(safeStorage.clear()).toBe(false);

      // Restore
      Object.defineProperty(global, "localStorage", {
        value: originalLocalStorage,
        configurable: true,
      });
    });
  });

  describe("2. Clean-Slate Zero-Division & Edge-Case Immunity", () => {
    beforeEach(() => {
      db.resetToCleanSlate();
    });

    it("Critical Path Method (CPM) returns safe empty model when database has zero tasks", () => {
      expect(() => {
        const cpm = db.getCriticalPathAnalysis();
        expect(cpm.projectDurationHours).toBe(0);
        expect(cpm.criticalPath).toEqual([]);
        expect(cpm.nodes).toEqual({});
        expect(cpm.bottlenecks).toEqual([]);
      }).not.toThrow();
    });

    it("Simulate Task Delay handles non-existent or empty task without throwing", () => {
      expect(() => {
        const sim = db.simulateTaskDelay("non-existent-task-id", 3);
        expect(sim.projectSlipHours).toBe(0);
        expect(sim.affectedTasks).toEqual([]);
      }).not.toThrow();
    });

    it("Workload Optimizer returns 0 variance and empty rebalance actions without throwing", () => {
      expect(() => {
        const opt = db.getOptimizedWorkload();
        expect(opt.rebalanceActions).toEqual([]);
        expect(opt.varianceReductionPercentage).toBe(0);
        expect(opt.overloadedLeadsResolved).toBe(0);
      }).not.toThrow();
    });

    it("Hackathon Risk Predictor handles empty state safely with nominal threat tier", () => {
      expect(() => {
        const report = db.getHackathonRiskReport();
        expect(report.overallThreatIndex).toBe(20);
        expect(report.threatTier).toBe("NOMINAL");
        expect(report.evaluatedTasks).toEqual([]);
      }).not.toThrow();
    });

    it("Run-of-Show timeline analysis operates reliably for any hour mark", () => {
      expect(() => {
        const ros0 = db.getRunOfShowAnalysis(0);
        const ros18 = db.getRunOfShowAnalysis(18);
        const ros36 = db.getRunOfShowAnalysis(36);
        const ros50 = db.getRunOfShowAnalysis(50); // boundary overflow test

        expect(ros0.upcomingSlots.length + ros0.completedSlots.length + (ros0.activeSlot ? 1 : 0)).toBeGreaterThan(0);
        expect(ros18.upcomingSlots.length + ros18.completedSlots.length + (ros18.activeSlot ? 1 : 0)).toBeGreaterThan(0);
        expect(ros36.upcomingSlots.length + ros36.completedSlots.length + (ros36.activeSlot ? 1 : 0)).toBeGreaterThan(0);
        expect(ros50.upcomingSlots.length + ros50.completedSlots.length + (ros50.activeSlot ? 1 : 0)).toBeGreaterThan(0);
      }).not.toThrow();
    });

    it("Judging teams handles clean slate with 0 teams without error", () => {
      expect(() => {
        const teams = db.getJudgingTeams();
        expect(teams).toEqual([]);
      }).not.toThrow();
    });
  });

  describe("3. Security Middleware Enforcement", () => {
    it("should reject malicious directory traversal attempts with HTTP 400", () => {
      const maliciousReq = new NextRequest("http://localhost:3000/api/files?path=../../etc/passwd");
      const res = middleware(maliciousReq);
      expect(res.status).toBe(400);
    });

    it("should inject all required enterprise security headers on valid requests", () => {
      const validReq = new NextRequest("http://localhost:3000/war-room");
      const res = middleware(validReq);

      expect(res.status).toBe(200);
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(res.headers.get("X-Frame-Options")).toBe("DENY");
      expect(res.headers.get("X-XSS-Protection")).toBe("1; mode=block");
      expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
      expect(res.headers.get("Permissions-Policy")).toBeDefined();
    });
  });
});
