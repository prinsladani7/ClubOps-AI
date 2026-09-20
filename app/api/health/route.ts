import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();

  try {
    const usersCount = db.getUsers().length;
    const tasksCount = db.getTasks().length;
    const projectsCount = db.getProjects().length;
    const judgingTeamsCount = db.getJudgingTeams().length;
    const mentorTicketsCount = db.getMentorTickets().length;
    const sponsorsCount = db.getSponsors().length;

    const payload = {
      status: "healthy",
      service: "ClubOps AI Production API Gateway",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.round(process.uptime()),
      environment: process.env.NODE_ENV || "production",
      database: {
        status: "connected",
        driver: "in-memory-reactive-store",
        entities: {
          users: usersCount,
          tasks: tasksCount,
          projects: projectsCount,
          judging_teams: judgingTeamsCount,
          mentor_tickets: mentorTicketsCount,
          sponsors: sponsorsCount,
        },
      },
      system: {
        memory_usage_mb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        node_version: process.version,
        platform: process.platform,
      },
      latency_ms: Date.now() - startTime,
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Health-Status": "healthy",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "degraded",
        service: "ClubOps AI Production API Gateway",
        timestamp: new Date().toISOString(),
        error: error?.message || "Health probe failed",
      },
      { status: 500 }
    );
  }
}
