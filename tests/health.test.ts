import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("Production Health Probe API (/api/health)", () => {
  it("returns HTTP 200 with healthy status and database metrics", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe("healthy");
    expect(data.service).toContain("ClubOps AI");
    expect(data.version).toBe("1.0.0");
    expect(data.database.status).toBe("connected");
    expect(data.database.entities.users).toBeGreaterThan(0);
    expect(data.database.entities.tasks).toBeGreaterThan(0);
    expect(data.database.entities.judging_teams).toBeGreaterThan(0);
    expect(data.database.entities.mentor_tickets).toBeGreaterThan(0);
    expect(data.database.entities.sponsors).toBeGreaterThan(0);
    expect(data.system.node_version).toBeDefined();
    expect(data.latency_ms).toBeGreaterThanOrEqual(0);
  });
});
