"use client";

import { useState, useMemo } from "react";
import { Task, TaskPriority, TaskStatus } from "@/types";

export type TaskViewMode = "kanban" | "table" | "graph";

export function useTaskFilters(tasks: Task[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("all");
  const [viewMode, setViewMode] = useState<TaskViewMode>("kanban");

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search text
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        const matchesOwner = task.owner?.name.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesOwner) return false;
      }

      // Priority filter
      if (selectedPriority !== "all" && task.priority !== selectedPriority) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "all" && task.status !== selectedStatus) {
        return false;
      }

      // Assignee filter
      if (selectedAssignee !== "all" && task.owner_id !== selectedAssignee) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, selectedPriority, selectedStatus, selectedAssignee]);

  return {
    searchQuery,
    setSearchQuery,
    selectedPriority,
    setSelectedPriority,
    selectedStatus,
    setSelectedStatus,
    selectedAssignee,
    setSelectedAssignee,
    viewMode,
    setViewMode,
    filteredTasks,
  };
}
