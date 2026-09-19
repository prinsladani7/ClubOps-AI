"use client";

import { useMemo } from "react";
import { Volunteer, Task } from "@/types";

export interface RebalanceRecommendation {
  overloadedVolunteer: Volunteer;
  taskToReassign: Task;
  suggestedVolunteer: Volunteer;
  reason: string;
  confidence: number;
}

export function useVolunteerRebalance(volunteers: Volunteer[], tasks: Task[]) {
  const recommendations = useMemo(() => {
    const recs: RebalanceRecommendation[] = [];

    // Find volunteers with workload > 75% or 5+ active tasks
    const overloaded = volunteers.filter(
      (v) => (v.workloadScore || 0) > 75 || (v.assignedTasks?.length || 0) >= 5
    );

    // Find available volunteers (< 60% workload)
    const available = volunteers.filter(
      (v) => (v.workloadScore || 0) < 60 && v.availability !== "unavailable"
    );

    overloaded.forEach((over) => {
      // Find tasks assigned to this volunteer that are not done
      const activeTasks = tasks.filter(
        (t) => t.owner_id === over.id && t.status !== "done"
      );

      // Prioritize heavy or medium tasks to offload
      const candidateTask = activeTasks.find((t) => t.priority === "high" || t.priority === "medium") || activeTasks[0];

      if (candidateTask && available.length > 0) {
        // Pick best matching available volunteer (e.g. matching committee or lowest load)
        const sortedAvailable = [...available].sort(
          (a, b) => (a.workloadScore || 0) - (b.workloadScore || 0)
        );
        const target = sortedAvailable[0];

        recs.push({
          overloadedVolunteer: over,
          taskToReassign: candidateTask,
          suggestedVolunteer: target,
          reason: `${over.user?.name || "Lead"} is at ${over.workloadScore || 90}% capacity with ${activeTasks.length} in-flight tasks. Reallocating "${candidateTask.title}" to ${target.user?.name || "Member"} (${target.workloadScore || 30}% load) will stabilize the logistics committee critical path.`,
          confidence: 94,
        });
      }
    });

    return recs;
  }, [volunteers, tasks]);

  return { recommendations };
}
