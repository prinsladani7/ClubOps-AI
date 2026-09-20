/**
 * Critical Path Method (CPM) & Schedule Float Engine
 * Engineered for collegiate hackathon operations (Bit N Build Hackathon 2026).
 *
 * Implements:
 * 1. Kahn's Algorithm for Topological Sorting & DAG Cycle Detection
 * 2. Forward Pass: Earliest Start (ES) and Earliest Finish (EF)
 * 3. Backward Pass: Latest Start (LS) and Latest Finish (LF)
 * 4. Slack Calculation: Total Float (TF) and Free Float (FF)
 * 5. Dynamic Downstream Delay Simulation: What-if analysis of milestone slippage
 */

export interface CPMTask {
  id: string;
  title: string;
  durationHours: number;
  dependencies: string[]; // Prerequisite task IDs that must finish before this starts
  assignedTo?: string;
  category?: string;
  isBlocked?: boolean;
}

export interface CPMNodeResult {
  id: string;
  title: string;
  durationHours: number;
  dependencies: string[];
  dependents: string[];
  earlyStart: number;
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
  totalFloat: number; // LF - EF (slack time before project deadline slips)
  freeFloat: number;  // min(ES of successors) - EF (slack without delaying successors)
  isCritical: boolean; // totalFloat === 0
  criticalityIndex: number; // 0 to 100 score indicating vulnerability
}

export interface CPMSimulationResult {
  projectDurationHours: number;
  criticalPath: string[]; // Sequence of task IDs on the critical path
  nodes: Record<string, CPMNodeResult>;
  hasCycles: boolean;
  cycleNodes?: string[];
  bottlenecks: {
    taskId: string;
    taskTitle: string;
    impactScore: number;
    reason: string;
  }[];
}

export interface DelayImpactResult {
  delayedTaskId: string;
  delayHours: number;
  originalProjectDuration: number;
  newProjectDuration: number;
  projectSlipHours: number;
  affectedTasks: {
    taskId: string;
    title: string;
    originalEarlyFinish: number;
    newEarlyFinish: number;
    slipHours: number;
    becameCritical: boolean;
  }[];
}

export class CriticalPathEngine {
  /**
   * Solve CPM schedule for a collection of tasks.
   */
  static solve(tasks: CPMTask[]): CPMSimulationResult {
    const taskMap = new Map<string, CPMTask>();
    const successorsMap = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    tasks.forEach((t) => {
      taskMap.set(t.id, t);
      successorsMap.set(t.id, []);
      inDegree.set(t.id, 0);
    });

    // Build adjacency list (successors) and calculate in-degree
    tasks.forEach((t) => {
      t.dependencies.forEach((depId) => {
        if (taskMap.has(depId)) {
          successorsMap.get(depId)!.push(t.id);
          inDegree.set(t.id, (inDegree.get(t.id) || 0) + 1);
        }
      });
    });

    // Kahn's Algorithm for Topological Sort
    const queue: string[] = [];
    inDegree.forEach((degree, id) => {
      if (degree === 0) queue.push(id);
    });

    const topoOrder: string[] = [];
    const inDegreeCopy = new Map(inDegree);

    while (queue.length > 0) {
      const u = queue.shift()!;
      topoOrder.push(u);

      const succs = successorsMap.get(u) || [];
      succs.forEach((v) => {
        const newDeg = inDegreeCopy.get(v)! - 1;
        inDegreeCopy.set(v, newDeg);
        if (newDeg === 0) queue.push(v);
      });
    }

    // Check for cycles in task dependencies
    if (topoOrder.length !== tasks.length) {
      const cycleCandidates = tasks
        .filter((t) => !topoOrder.includes(t.id))
        .map((t) => t.id);
      return {
        projectDurationHours: 0,
        criticalPath: [],
        nodes: {},
        hasCycles: true,
        cycleNodes: cycleCandidates,
        bottlenecks: [],
      };
    }

    // Forward Pass: Calculate Early Start (ES) and Early Finish (EF)
    const earlyStart = new Map<string, number>();
    const earlyFinish = new Map<string, number>();

    topoOrder.forEach((id) => {
      const t = taskMap.get(id)!;
      let maxPredEF = 0;
      t.dependencies.forEach((depId) => {
        if (taskMap.has(depId)) {
          maxPredEF = Math.max(maxPredEF, earlyFinish.get(depId) || 0);
        }
      });
      earlyStart.set(id, maxPredEF);
      earlyFinish.set(id, maxPredEF + t.durationHours);
    });

    // Total Project Duration is max of all Early Finishes
    let projectDuration = 0;
    earlyFinish.forEach((ef) => {
      if (ef > projectDuration) projectDuration = ef;
    });

    // Backward Pass: Calculate Late Finish (LF) and Late Start (LS)
    const lateFinish = new Map<string, number>();
    const lateStart = new Map<string, number>();

    // Reverse topological order
    for (let i = topoOrder.length - 1; i >= 0; i--) {
      const id = topoOrder[i];
      const t = taskMap.get(id)!;
      const succs = successorsMap.get(id) || [];

      if (succs.length === 0) {
        // End node
        lateFinish.set(id, projectDuration);
      } else {
        let minSuccLS = Infinity;
        succs.forEach((succId) => {
          minSuccLS = Math.min(minSuccLS, lateStart.get(succId) ?? projectDuration);
        });
        lateFinish.set(id, minSuccLS);
      }
      lateStart.set(id, lateFinish.get(id)! - t.durationHours);
    }

    // Calculate Slack / Float and build Node Results
    const nodes: Record<string, CPMNodeResult> = {};
    const criticalPath: string[] = [];

    topoOrder.forEach((id) => {
      const t = taskMap.get(id)!;
      const es = earlyStart.get(id)!;
      const ef = earlyFinish.get(id)!;
      const ls = lateStart.get(id)!;
      const lf = lateFinish.get(id)!;

      const totalFloat = Math.max(0, lf - ef);

      // Free Float: min(ES of successors) - EF
      const succs = successorsMap.get(id) || [];
      let minSuccES = projectDuration;
      if (succs.length > 0) {
        minSuccES = Math.min(...succs.map((s) => earlyStart.get(s)!));
      }
      const freeFloat = Math.max(0, minSuccES - ef);

      const isCritical = totalFloat < 0.001; // Accounting for floating point tolerances
      if (isCritical) {
        criticalPath.push(id);
      }

      // Criticality index based on low float and fan-out
      const fanOut = succs.length;
      const floatFactor = Math.max(0, 100 - totalFloat * 15);
      const criticalityIndex = Math.min(
        100,
        Math.round(floatFactor * 0.7 + Math.min(30, fanOut * 10))
      );

      nodes[id] = {
        id,
        title: t.title,
        durationHours: t.durationHours,
        dependencies: t.dependencies,
        dependents: succs,
        earlyStart: es,
        earlyFinish: ef,
        lateStart: ls,
        lateFinish: lf,
        totalFloat,
        freeFloat,
        isCritical,
        criticalityIndex,
      };
    });

    // Identify Bottlenecks (Critical or near-critical tasks with high fanout or currently blocked)
    const bottlenecks = Object.values(nodes)
      .filter((n) => n.isCritical || n.totalFloat <= 1 || taskMap.get(n.id)?.isBlocked)
      .sort((a, b) => b.criticalityIndex - a.criticalityIndex)
      .slice(0, 5)
      .map((n) => ({
        taskId: n.id,
        taskTitle: n.title,
        impactScore: n.criticalityIndex,
        reason: n.isCritical
          ? `Zero slack (${n.totalFloat}h float). Any delay here directly pushes the 36h hackathon timeline by an equal amount.`
          : `Near-critical path (${n.totalFloat.toFixed(1)}h buffer). Has ${n.dependents.length} dependent deliverables downstream.`,
      }));

    return {
      projectDurationHours: projectDuration,
      criticalPath,
      nodes,
      hasCycles: false,
      bottlenecks,
    };
  }

  /**
   * Simulate a delay on a specific task and determine project slip and affected milestones.
   */
  static simulateDelay(
    tasks: CPMTask[],
    delayedTaskId: string,
    delayHours: number
  ): DelayImpactResult {
    const baseSchedule = this.solve(tasks);

    // Create modified task list with extended duration
    const modifiedTasks = tasks.map((t) => {
      if (t.id === delayedTaskId) {
        return { ...t, durationHours: t.durationHours + delayHours };
      }
      return t;
    });

    const modifiedSchedule = this.solve(modifiedTasks);
    const projectSlip = Math.max(
      0,
      modifiedSchedule.projectDurationHours - baseSchedule.projectDurationHours
    );

    const affectedTasks: DelayImpactResult["affectedTasks"] = [];

    Object.keys(modifiedSchedule.nodes).forEach((id) => {
      const origNode = baseSchedule.nodes[id];
      const newNode = modifiedSchedule.nodes[id];
      if (!origNode || !newNode) return;

      const slip = newNode.earlyFinish - origNode.earlyFinish;
      if (slip > 0.001 || id === delayedTaskId) {
        affectedTasks.push({
          taskId: id,
          title: newNode.title,
          originalEarlyFinish: origNode.earlyFinish,
          newEarlyFinish: newNode.earlyFinish,
          slipHours: slip,
          becameCritical: !origNode.isCritical && newNode.isCritical,
        });
      }
    });

    return {
      delayedTaskId,
      delayHours,
      originalProjectDuration: baseSchedule.projectDurationHours,
      newProjectDuration: modifiedSchedule.projectDurationHours,
      projectSlipHours: projectSlip,
      affectedTasks,
    };
  }
}
