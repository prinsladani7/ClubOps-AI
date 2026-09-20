"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Briefcase,
  Shield,
  ArrowLeft,
  Mail,
  UserCheck,
  Calendar,
  Layers,
  CheckCircle2,
  Users,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Zap,
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  UserPlus,
  ExternalLink,
  Download,
  Info,
  Clock,
  Flame,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkloadGauge } from "@/components/ui/WorkloadGauge";
import { Modal } from "@/components/ui/modal";
import { User, Volunteer, Task, Project, Team } from "@/types";

export default function AdminOrganizersHierarchyPage() {
  const {
    users,
    projects,
    teams,
    teamMembers,
    projectMembers,
    volunteers,
    tasks,
    showToast,
  } = useClubOps();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("all");
  const [selectedAvailabilityFilter, setSelectedAvailabilityFilter] = useState("all");
  const [expandedOrganizers, setExpandedOrganizers] = useState<Record<string, boolean>>({
    "usr-jay": true,
    "usr-priya": true,
  });
  const [inspectingVolunteer, setInspectingVolunteer] = useState<Volunteer | null>(null);

  // All authorized Organizers
  const organizers = useMemo(() => {
    return users.filter((u) => u.role === "organizer");
  }, [users]);

  // Toggle single organizer expansion
  const toggleOrganizer = (orgId: string) => {
    setExpandedOrganizers((prev) => ({
      ...prev,
      [orgId]: !prev[orgId],
    }));
  };

  // Expand all / Collapse all
  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    organizers.forEach((org) => {
      allExpanded[org.id] = true;
    });
    setExpandedOrganizers(allExpanded);
  };

  const collapseAll = () => {
    setExpandedOrganizers({});
  };

  // Build per-organizer data structure
  const organizerHierarchy = useMemo(() => {
    return organizers.map((org) => {
      // Projects assigned to this organizer
      const assignedProjects = projects.filter(
        (p) => p.organizer_id === org.id || (p.organizers && p.organizers.includes(org.id))
      );
      const assignedProjectIds = assignedProjects.map((p) => p.id);

      // Teams managed by this organizer
      const managedTeams = teams.filter((t) => t.organizer_id === org.id);
      const managedTeamIds = managedTeams.map((t) => t.id);

      // Find all volunteers under this organizer:
      // 1. Through teamMembers in managed teams
      const teamVolunteerUserIds = teamMembers
        .filter((tm) => managedTeamIds.includes(tm.team_id) && tm.role === "volunteer")
        .map((tm) => tm.user_id);

      // 2. Through projectMembers in assigned projects
      const projectVolunteerUserIds = projectMembers
        .filter((pm) => assignedProjectIds.includes(pm.project_id) && pm.role === "volunteer")
        .map((pm) => pm.user_id);

      // 3. Through tasks assigned to volunteers under this organizer's projects or created by org
      const taskVolunteerUserIds = tasks
        .filter((t) => (assignedProjectIds.includes(t.project_id || "") || t.created_by === org.id) && t.owner_id)
        .map((t) => t.owner_id as string);

      // Union of unique volunteer user IDs
      const uniqueVolunteerUserIds = Array.from(
        new Set([...teamVolunteerUserIds, ...projectVolunteerUserIds, ...taskVolunteerUserIds])
      );

      // Map to Volunteer details
      const assignedVolunteers = uniqueVolunteerUserIds
        .map((uId) => {
          const vol = volunteers.find((v) => v.user_id === uId);
          const user = users.find((u) => u.id === uId);
          if (!user) return null;

          // Find specific team(s) this volunteer is on under this organizer
          const volTeams = managedTeams.filter((t) =>
            teamMembers.some((tm) => tm.team_id === t.id && tm.user_id === uId)
          );

          // Find tasks assigned to this volunteer under this organizer's projects
          const volTasks = tasks.filter(
            (t) => t.owner_id === uId && (assignedProjectIds.includes(t.project_id || "") || t.created_by === org.id)
          );

          return {
            volunteer: vol,
            user,
            teams: volTeams,
            tasks: volTasks,
            skills: vol?.skills || ["General Operations"],
            availability: vol?.availability || "available",
            workloadScore: vol?.workloadScore || 30,
          };
        })
        .filter(Boolean) as {
        volunteer?: Volunteer;
        user: User;
        teams: Team[];
        tasks: Task[];
        skills: string[];
        availability: "available" | "busy" | "overloaded";
        workloadScore: number;
      }[];

      // Tasks awaiting review for this organizer
      const pendingReviewsCount = tasks.filter(
        (t) =>
          (assignedProjectIds.includes(t.project_id || "") || t.created_by === org.id) &&
          t.status === "review"
      ).length;

      return {
        organizer: org,
        projects: assignedProjects,
        teams: managedTeams,
        volunteers: assignedVolunteers,
        pendingReviewsCount,
      };
    });
  }, [organizers, projects, teams, teamMembers, projectMembers, volunteers, tasks, users]);

  // Find all volunteers that are already assigned to at least one organizer
  const allAssignedVolunteerUserIds = useMemo(() => {
    const ids = new Set<string>();
    organizerHierarchy.forEach((h) => {
      h.volunteers.forEach((v) => ids.add(v.user.id));
    });
    return ids;
  }, [organizerHierarchy]);

  // Unassigned volunteer pool
  const unassignedVolunteers = useMemo(() => {
    return volunteers
      .filter((v) => !allAssignedVolunteerUserIds.has(v.user_id))
      .map((vol) => {
        const user = users.find((u) => u.id === vol.user_id);
        const userTasks = tasks.filter((t) => t.owner_id === vol.user_id);
        return {
          volunteer: vol,
          user: user || { id: vol.user_id, name: "Volunteer", email: "volunteer@syntaxsquad.edu", role: "volunteer" as const },
          tasks: userTasks,
          skills: vol.skills,
          availability: vol.availability,
          workloadScore: vol.workloadScore || 20,
        };
      });
  }, [volunteers, allAssignedVolunteerUserIds, users, tasks]);

  // Filtered organizers and volunteers based on search & filters
  const filteredHierarchy = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return organizerHierarchy
      .filter((item) => {
        // Project filter
        if (selectedProjectFilter !== "all") {
          const hasProject = item.projects.some((p) => p.id === selectedProjectFilter);
          if (!hasProject) return false;
        }
        return true;
      })
      .map((item) => {
        // Filter volunteers within this organizer
        const filteredVols = item.volunteers.filter((vol) => {
          // Availability filter
          if (selectedAvailabilityFilter !== "all" && vol.availability !== selectedAvailabilityFilter) {
            return false;
          }

          if (!q) return true;

          // Search query check
          const nameMatch = vol.user.name.toLowerCase().includes(q);
          const emailMatch = vol.user.email.toLowerCase().includes(q);
          const skillMatch = vol.skills.some((s) => s.toLowerCase().includes(q));
          const taskMatch = vol.tasks.some((t) => t.title.toLowerCase().includes(q));
          const teamMatch = vol.teams.some((t) => t.name.toLowerCase().includes(q));

          return nameMatch || emailMatch || skillMatch || taskMatch || teamMatch;
        });

        const orgNameMatch = item.organizer.name.toLowerCase().includes(q);
        const orgEmailMatch = item.organizer.email.toLowerCase().includes(q);

        // Keep organizer if they match, or if any of their volunteers match
        const shouldInclude = !q || orgNameMatch || orgEmailMatch || filteredVols.length > 0;

        return {
          ...item,
          volunteers: shouldInclude && (orgNameMatch || orgEmailMatch) && filteredVols.length === 0 ? item.volunteers : filteredVols,
          matches: shouldInclude,
        };
      })
      .filter((item) => item.matches);
  }, [organizerHierarchy, searchQuery, selectedProjectFilter, selectedAvailabilityFilter]);

  // Total metrics
  const totalAssignedVolunteersCount = useMemo(() => {
    const uniqueIds = new Set<string>();
    organizerHierarchy.forEach((h) => h.volunteers.forEach((v) => uniqueIds.add(v.user.id)));
    return uniqueIds.size;
  }, [organizerHierarchy]);

  const handleExportRoster = () => {
    const exportData = organizerHierarchy.map((h) => ({
      organizerName: h.organizer.name,
      organizerEmail: h.organizer.email,
      projects: h.projects.map((p) => p.name).join("; "),
      teams: h.teams.map((t) => t.name).join("; "),
      volunteerCount: h.volunteers.length,
      volunteers: h.volunteers.map((v) => ({
        name: v.user.name,
        email: v.user.email,
        skills: v.skills.join(", "),
        workloadScore: v.workloadScore,
        availability: v.availability,
        tasksAssigned: v.tasks.length,
      })),
    }));

    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonStr);
    downloadAnchor.setAttribute("download", `clubops-organizer-volunteer-roster.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast("Exported Team Hierarchy Roster to JSON.");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/dashboard" className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Admin Dashboard
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-mono text-cyan-400 font-semibold">Organizers & Teams</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <span>Lead Organizers & Volunteer Hierarchy</span>
            <Badge variant="cyan" className="text-xs py-0.5 px-2 font-mono">
              PER-ORGANIZER ROSTER
            </Badge>
          </h1>
          <p className="text-xs text-slate-400 max-w-3xl mt-1 leading-relaxed">
            Direct operational structure showing each designated Lead Organizer and the complete roster of volunteers working under their project workstreams and functional squads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={expandAll}
            className="text-xs h-8 border-slate-700 hover:bg-slate-800 text-slate-200"
          >
            Expand All
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={collapseAll}
            className="text-xs h-8 border-slate-700 hover:bg-slate-800 text-slate-200"
          >
            Collapse All
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportRoster}
            className="text-xs h-8 border-slate-700 hover:bg-slate-800 text-cyan-300 gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Roster</span>
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Lead Organizers</span>
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{organizers.length}</div>
          <p className="text-[11px] text-slate-400 font-mono">Executive Workstream Leads</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Assigned Volunteers</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{totalAssignedVolunteersCount}</div>
          <p className="text-[11px] text-emerald-400 font-mono">Mapped to project squads</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Active Workstreams</span>
            <FolderKanban className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{projects.filter((p) => p.status === "active").length}</div>
          <p className="text-[11px] text-slate-400 font-mono">{teams.length} Functional Squads</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Unassigned Pool</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{unassignedVolunteers.length}</div>
          <p className="text-[11px] text-slate-400 font-mono">Available for delegation</p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by organizer, volunteer name, verified skill, task, or squad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950/70 border border-slate-800 rounded-xl px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Project:</span>
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950/70 border border-slate-800 rounded-xl px-2.5 py-1">
            <span>Availability:</span>
            <select
              value={selectedAvailabilityFilter}
              onChange={(e) => setSelectedAvailabilityFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Capacity</option>
              <option value="available" className="bg-slate-900 text-emerald-400">Available</option>
              <option value="busy" className="bg-slate-900 text-amber-400">Busy</option>
              <option value="overloaded" className="bg-slate-900 text-rose-400">Overloaded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Per-Organizer Tables List */}
      <div className="space-y-6">
        {filteredHierarchy.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/30 text-slate-400 space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-white">No matching organizers or volunteers found</p>
            <p className="text-xs text-slate-500">Try adjusting your search criteria or clearing filters.</p>
          </div>
        ) : (
          filteredHierarchy.map((item) => {
            const isExpanded = !!expandedOrganizers[item.organizer.id];

            return (
              <div
                key={item.organizer.id}
                className="rounded-2xl border border-slate-800/90 bg-slate-900/50 backdrop-blur-xl overflow-hidden shadow-lg hover:border-slate-700/80 transition-all"
              >
                {/* Organizer Header Card */}
                <div
                  onClick={() => toggleOrganizer(item.organizer.id)}
                  className="p-5 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-indigo-950/20 border-b border-slate-800/80 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 select-none hover:bg-slate-900/80 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <button
                      className="w-7 h-7 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                      title={isExpanded ? "Collapse Volunteers" : "Expand Volunteers"}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 p-[1px] shadow-sm flex-shrink-0">
                      <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center font-extrabold text-cyan-300 text-base">
                        {item.organizer.name.charAt(0)}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-base font-bold text-white">{item.organizer.name}</h2>
                        <Badge variant="cyan" className="text-[10px] font-mono uppercase font-bold py-0 px-2">
                          Lead Organizer
                        </Badge>
                        {item.organizer.status && item.organizer.status !== "active" && (
                          <Badge variant="destructive" className="text-[10px] font-mono py-0 px-1.5">
                            {item.organizer.status}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 font-mono">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Mail className="w-3 h-3 text-slate-500" /> {item.organizer.email}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Active Clearance
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Organizer Workstream Tags & Badges */}
                  <div className="flex flex-wrap items-center gap-3 lg:gap-4 text-xs">
                    {/* Assigned Projects */}
                    <div className="flex flex-col items-start lg:items-end">
                      <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">
                        Projects ({item.projects.length})
                      </span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {item.projects.map((p) => (
                          <span
                            key={p.id}
                            className="px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-[11px] text-slate-200 font-medium"
                          >
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Assigned Squads */}
                    <div className="flex flex-col items-start lg:items-end">
                      <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">
                        Squads ({item.teams.length})
                      </span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {item.teams.map((t) => (
                          <span
                            key={t.id}
                            className="px-2 py-0.5 rounded-md bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-300"
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Volunteers Count Pill */}
                    <div className="flex items-center gap-2 pl-2 lg:border-l border-slate-800">
                      <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-cyan-300 flex items-center gap-1.5 font-mono text-xs font-semibold">
                        <Users className="w-3.5 h-3.5" />
                        <span>{item.volunteers.length} Volunteers</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nested Volunteer List Table Under This Organizer */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 bg-slate-950/70 border-t border-slate-800/60 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/60 text-xs">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-cyan-400" />
                        <span className="font-bold text-white uppercase tracking-wider text-[11px] font-mono">
                          Volunteers Under {item.organizer.name} ({item.volunteers.length})
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Active committee leads, developers, designers, and logistics crew
                      </span>
                    </div>

                    {item.volunteers.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500 italic">
                        No volunteers currently assigned to this organizer's projects or squads.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                              <th className="pb-2.5 font-semibold">Volunteer</th>
                              <th className="pb-2.5 font-semibold">Assigned Squad & Role</th>
                              <th className="pb-2.5 font-semibold">Verified Skills</th>
                              <th className="pb-2.5 font-semibold">Assigned Deliverables</th>
                              <th className="pb-2.5 font-semibold">Workload Capacity</th>
                              <th className="pb-2.5 font-semibold">Status</th>
                              <th className="pb-2.5 text-right font-semibold">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {item.volunteers.map((volItem) => {
                              const isOverloaded = volItem.workloadScore > 75;
                              const isBusy = volItem.workloadScore > 50 && volItem.workloadScore <= 75;

                              return (
                                <tr
                                  key={volItem.user.id}
                                  className="hover:bg-slate-900/40 transition-colors group"
                                >
                                  {/* Volunteer Info */}
                                  <td className="py-3 pr-4">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-300 flex-shrink-0">
                                        {volItem.user.name.charAt(0)}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-bold text-slate-100 truncate group-hover:text-cyan-300 transition-colors">
                                          {volItem.user.name}
                                        </p>
                                        <p className="text-[11px] text-slate-400 font-mono truncate">
                                          {volItem.user.email}
                                        </p>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Assigned Squad / Team */}
                                  <td className="py-3 pr-4">
                                    {volItem.teams.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {volItem.teams.map((t) => (
                                          <span
                                            key={t.id}
                                            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-medium"
                                          >
                                            {t.name}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-[11px] text-slate-500 italic">Direct Project Member</span>
                                    )}
                                  </td>

                                  {/* Skills */}
                                  <td className="py-3 pr-4 max-w-xs">
                                    <div className="flex flex-wrap gap-1">
                                      {volItem.skills.slice(0, 3).map((skill, idx) => (
                                        <span
                                          key={idx}
                                          className="px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-[10px] text-slate-300"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                      {volItem.skills.length > 3 && (
                                        <span className="text-[10px] text-slate-500 font-mono">
                                          +{volItem.skills.length - 3}
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Tasks Assigned */}
                                  <td className="py-3 pr-4">
                                    <div className="space-y-0.5">
                                      <span className="font-semibold text-slate-200">
                                        {volItem.tasks.length} task(s)
                                      </span>
                                      {volItem.tasks[0] && (
                                        <p className="text-[11px] text-slate-400 truncate max-w-[200px]" title={volItem.tasks[0].title}>
                                          • {volItem.tasks[0].title}
                                        </p>
                                      )}
                                    </div>
                                  </td>

                                  {/* Workload Gauge */}
                                  <td className="py-3 pr-4 min-w-[140px]">
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between text-[11px] font-mono">
                                        <span
                                          className={
                                            isOverloaded
                                              ? "text-rose-400 font-bold"
                                              : isBusy
                                              ? "text-amber-400 font-bold"
                                              : "text-emerald-400"
                                          }
                                        >
                                          {volItem.workloadScore}%
                                        </span>
                                        <span className="text-[10px] text-slate-500 uppercase">
                                          {isOverloaded ? "Overloaded" : isBusy ? "Busy" : "Normal"}
                                        </span>
                                      </div>
                                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all ${
                                            isOverloaded
                                              ? "bg-rose-500"
                                              : isBusy
                                              ? "bg-amber-500"
                                              : "bg-emerald-500"
                                          }`}
                                          style={{ width: `${volItem.workloadScore}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>

                                  {/* Availability Badge */}
                                  <td className="py-3 pr-4">
                                    <Badge
                                      variant={
                                        volItem.availability === "overloaded"
                                          ? "destructive"
                                          : volItem.availability === "busy"
                                          ? "warning"
                                          : "cyan"
                                      }
                                      className="text-[10px] py-0 px-2 uppercase font-mono"
                                    >
                                      {volItem.availability}
                                    </Badge>
                                  </td>

                                  {/* Actions */}
                                  <td className="py-3 text-right">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        if (volItem.volunteer) {
                                          setInspectingVolunteer(volItem.volunteer);
                                        } else {
                                          showToast(`Viewing profile for ${volItem.user.name}`);
                                        }
                                      }}
                                      className="h-7 text-[11px] px-2.5 border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200"
                                    >
                                      Inspect
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Unassigned Volunteers Pool (Section for At-Large Volunteers) */}
      {unassignedVolunteers.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>At-Large Volunteer Pool ({unassignedVolunteers.length})</span>
                <Badge variant="warning" className="text-[10px] font-mono">
                  UNASSIGNED TO SQUAD
                </Badge>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Volunteers registered in the club directory who have not yet been assigned to an organizer's project or squad.
              </p>
            </div>
            <Link
              href="/admin/volunteers"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>Full Volunteer Workload Balancer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unassignedVolunteers.map((unItem) => (
              <div
                key={unItem.user.id}
                className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
                      {unItem.user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{unItem.user.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{unItem.user.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[9px] font-mono uppercase">
                    {unItem.availability}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase">Skills:</span>
                  <div className="flex flex-wrap gap-1">
                    {unItem.skills.map((s, idx) => (
                      <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-mono">Load: {unItem.workloadScore}%</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setInspectingVolunteer(unItem.volunteer);
                    }}
                    className="h-6 text-[10px] px-2 border-slate-700 hover:bg-slate-800 text-slate-200"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Volunteer Detailed Inspector Modal */}
      {inspectingVolunteer && (
        <Modal
          isOpen={!!inspectingVolunteer}
          onClose={() => setInspectingVolunteer(null)}
          title={`Volunteer Clearance: ${inspectingVolunteer.user?.name || "Member Profile"}`}
          description="Operational profile, verified skills, and assigned deliverables across project workstreams."
        >
          <div className="space-y-5 text-xs">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{inspectingVolunteer.user?.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{inspectingVolunteer.user?.email}</p>
                </div>
                <Badge
                  variant={
                    inspectingVolunteer.availability === "overloaded"
                      ? "destructive"
                      : inspectingVolunteer.availability === "busy"
                      ? "warning"
                      : "cyan"
                  }
                  className="text-[10px] py-0 px-2 font-mono uppercase"
                >
                  {inspectingVolunteer.availability}
                </Badge>
              </div>

              {inspectingVolunteer.notes && (
                <p className="text-slate-300 text-[11px] pt-1 border-t border-slate-800 leading-relaxed">
                  {inspectingVolunteer.notes}
                </p>
              )}
            </div>

            {/* Verified Skills */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase font-bold text-slate-400">
                Verified Operational Skills
              </span>
              <div className="flex flex-wrap gap-1.5">
                {inspectingVolunteer.skills.map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="text-[11px] py-0.5 px-2">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Workload Metric */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">Live Workload Allocation Score</span>
                <span className="font-mono font-bold text-cyan-400">{inspectingVolunteer.workloadScore || 25}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    (inspectingVolunteer.workloadScore || 0) > 75
                      ? "bg-rose-500"
                      : (inspectingVolunteer.workloadScore || 0) > 50
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${inspectingVolunteer.workloadScore || 25}%` }}
                />
              </div>
            </div>

            {/* Assigned Deliverables List */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase font-bold text-slate-400">
                Assigned Deliverables ({tasks.filter((t) => t.owner_id === inspectingVolunteer.user_id).length})
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {tasks
                  .filter((t) => t.owner_id === inspectingVolunteer.user_id)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-slate-200 truncate">{task.title}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Due: {task.due_at ? new Date(task.due_at).toLocaleDateString() : "Unscheduled"}
                        </p>
                      </div>
                      <Badge
                        variant={
                          task.status === "blocked"
                            ? "destructive"
                            : task.status === "done" || task.status === "completed"
                            ? "success"
                            : "secondary"
                        }
                        className="text-[9px] font-mono uppercase"
                      >
                        {task.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectingVolunteer(null)}
                className="text-xs border-slate-700"
              >
                Close Inspector
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
