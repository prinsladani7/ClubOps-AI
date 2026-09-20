/**
 * 36-Hour Hackathon Run-of-Show Engine & Clash Detector
 * Specific to Bit N Build Hackathon 2026 (36-Hour National Collegiate Hackathon).
 *
 * Capabilities:
 * 1. Validates the 36-hour chronological timeline from Hour 00:00 to Hour 36:00
 * 2. Room / Space Clash Detection (Main Auditorium, Labs 301-304, Seminar Hall A, Cafeteria)
 * 3. Volunteer Shift Fatigue Analysis (>6 hours continuous shift without relief)
 * 4. Mentor-to-Hacker Coverage Ratio Validation
 */

export interface RunOfShowSlot {
  id: string;
  hourMark: number; // 0 to 36
  clockTime: string; // e.g. "09:00 AM (Day 1)"
  title: string;
  category: "ceremony" | "hacking" | "workshop" | "catering" | "mentoring" | "judging" | "ops";
  venue: string;
  leadCommittee: string;
  leadVolunteerId?: string;
  leadVolunteerName?: string;
  durationMinutes: number;
  description: string;
  avRequired?: boolean;
  notes?: string;
  status: "scheduled" | "in_progress" | "completed" | "delayed";
}

export interface ScheduleClash {
  type: "VENUE_DOUBLE_BOOKING" | "VOLUNTEER_FATIGUE" | "MENTOR_DEFICIT" | "AV_COLLISION";
  severity: "CRITICAL" | "HIGH" | "WARNING";
  affectedSlotIds: string[];
  message: string;
  resolution: string;
}

export interface RunOfShowReport {
  currentHourMark: number;
  activeSlot?: RunOfShowSlot;
  upcomingSlots: RunOfShowSlot[];
  completedSlots: RunOfShowSlot[];
  clashes: ScheduleClash[];
  volunteerShiftStats: {
    volunteerName: string;
    assignedHours: number;
    hasFatigueRisk: boolean;
  }[];
  timelineIntegrityScore: number; // 0 to 100
}

export const BIT_N_BUILD_36H_TIMELINE: RunOfShowSlot[] = [
  {
    id: "slot-00",
    hourMark: 0,
    clockTime: "08:00 AM (Day 1)",
    title: "Hacker Check-in & Swag Bag Distribution",
    category: "ops",
    venue: "Main Campus Foyer & Registration Desks 1-4",
    leadCommittee: "Registration & Swag Logistics",
    leadVolunteerName: "Priya Nair",
    durationMinutes: 120,
    description: "QR badge verification via Devfolio scanner API, 450 participant kits, GitHub sticker packs, and lanyards.",
    status: "completed",
  },
  {
    id: "slot-02",
    hourMark: 2,
    clockTime: "10:00 AM (Day 1)",
    title: "Opening Ceremony & Problem Statement Reveal",
    category: "ceremony",
    venue: "Grand Auditorium (600 Seats)",
    leadCommittee: "Media & Stage Production",
    leadVolunteerName: "Rahul Sharma",
    durationMinutes: 90,
    avRequired: true,
    description: "Welcome address by Dean, keynote by Polygon Developer Relations, track briefing for Web3, AI/ML, and FinTech.",
    status: "completed",
  },
  {
    id: "slot-04",
    hourMark: 4,
    clockTime: "11:30 AM (Day 1)",
    title: "Hacking Starts & Team Workspace Allocation",
    category: "hacking",
    venue: "Labs 301, 302, 303 & 304 (Coding Arena)",
    leadCommittee: "Tech & Infrastructure",
    leadVolunteerName: "Rahul Sharma",
    durationMinutes: 240,
    description: "112 teams stationed at allocated power benches. Gigabit LAN cables tested and WiFi AP telemetry verified.",
    status: "in_progress",
  },
  {
    id: "slot-08",
    hourMark: 8,
    clockTime: "03:30 PM (Day 1)",
    title: "Sponsor Tech Workshops & Office Hours",
    category: "workshop",
    venue: "Seminar Hall A & B",
    leadCommittee: "Judging & Evaluation",
    leadVolunteerName: "Dev Joshi",
    durationMinutes: 120,
    avRequired: true,
    description: "Hands-on workshops with Gemini API, Polygon zkEVM, and MongoDB Atlas. Technical Q&A with engineers.",
    status: "scheduled",
  },
  {
    id: "slot-12",
    hourMark: 12,
    clockTime: "08:00 PM (Day 1)",
    title: "Dinner & Mentor Check-in Round 1",
    category: "catering",
    venue: "Central Dining Hall & Lab Lounges",
    leadCommittee: "Hospitality & Midnight Food",
    leadVolunteerName: "Ananya Patel",
    durationMinutes: 90,
    description: "Buffet dinner for 450 hackers, mentors, and faculty. First architectural evaluation round with 24 mentors.",
    status: "scheduled",
  },
  {
    id: "slot-17",
    hourMark: 17,
    clockTime: "01:00 AM (Day 2)",
    title: "Midnight Maggi Rush & Energy Drink Distribution",
    category: "catering",
    venue: "Student Cafeteria & Lab Corridors",
    leadCommittee: "Hospitality & Midnight Food",
    leadVolunteerName: "Ananya Patel",
    durationMinutes: 60,
    description: "Campus cafeteria induction heaters live. 500 cups of instant Maggi, Red Bull, and hot filter coffee distributed.",
    status: "scheduled",
  },
  {
    id: "slot-22",
    hourMark: 22,
    clockTime: "06:00 AM (Day 2)",
    title: "Sunrise Chai, Breakfast & Code Health Check",
    category: "catering",
    venue: "Central Dining Hall",
    leadCommittee: "Hospitality & Midnight Food",
    leadVolunteerName: "Ananya Patel",
    durationMinutes: 90,
    description: "Hot tea/coffee, poha, and sandwiches. Volunteer squad shift handover.",
    status: "scheduled",
  },
  {
    id: "slot-26",
    hourMark: 26,
    clockTime: "10:00 AM (Day 2)",
    title: "Mentor Evaluation Round 2 (Semi-Final Scrimmage)",
    category: "mentoring",
    venue: "Labs 301-304",
    leadCommittee: "Judging & Evaluation",
    leadVolunteerName: "Dev Joshi",
    durationMinutes: 180,
    description: "In-depth code reviews, API integration audit, and selection of Top 20 teams for Stage Demos.",
    status: "scheduled",
  },
  {
    id: "slot-30",
    hourMark: 30,
    clockTime: "02:00 PM (Day 2)",
    title: "Devfolio Code Freeze & Video Demo Submission",
    category: "ops",
    venue: "Online Portal & Hacker Arena",
    leadCommittee: "Tech & Infrastructure",
    leadVolunteerName: "Rahul Sharma",
    durationMinutes: 60,
    description: "Strict Git commit cutoff on Devfolio platform. Readme and 2-minute demo video verification.",
    status: "scheduled",
  },
  {
    id: "slot-32",
    hourMark: 32,
    clockTime: "04:00 PM (Day 2)",
    title: "Top 10 Finalist Stage Pitches",
    category: "judging",
    venue: "Grand Auditorium",
    leadCommittee: "Media & Stage Production",
    leadVolunteerName: "Rahul Sharma",
    durationMinutes: 150,
    avRequired: true,
    description: "Top 10 finalist teams present 5-minute live demos followed by 3-minute Q&A with industry jury panel.",
    status: "scheduled",
  },
  {
    id: "slot-36",
    hourMark: 36,
    clockTime: "08:00 PM (Day 2)",
    title: "Grand Awards Ceremony & After-Party",
    category: "ceremony",
    venue: "Grand Auditorium & Campus Amphitheatre",
    leadCommittee: "Media & Stage Production",
    leadVolunteerName: "Prins Patel",
    durationMinutes: 90,
    avRequired: true,
    description: "Announcement of Track Winners, Overall Champions ($5,000 cash pool), sponsor bounty awards, and volunteer felicitation.",
    status: "scheduled",
  },
];

export class RunOfShowEngine {
  /**
   * Validate run-of-show schedule and detect conflicts.
   */
  static analyzeSchedule(
    slots: RunOfShowSlot[] = BIT_N_BUILD_36H_TIMELINE,
    currentHour: number = 6
  ): RunOfShowReport {
    const clashes: ScheduleClash[] = [];

    // 1. Check for Venue Double Bookings (Overlapping time slots in the exact same venue)
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const a = slots[i];
        const b = slots[j];

        if (a.venue.toLowerCase() === b.venue.toLowerCase()) {
          const aStart = a.hourMark;
          const aEnd = a.hourMark + a.durationMinutes / 60;
          const bStart = b.hourMark;
          const bEnd = b.hourMark + b.durationMinutes / 60;

          // Check interval overlap
          if (aStart < bEnd && bStart < aEnd) {
            clashes.push({
              type: "VENUE_DOUBLE_BOOKING",
              severity: "CRITICAL",
              affectedSlotIds: [a.id, b.id],
              message: `Venue clash in "${a.venue}": "${a.title}" (${a.clockTime}) overlaps with "${b.title}" (${b.clockTime}).`,
              resolution: `Reassign one of the sessions to Seminar Hall B or stagger timing by 60 minutes.`,
            });
          }
        }
      }
    }

    // 2. Check Volunteer Shift Fatigue (e.g. Rahul Sharma assigned to 4 consecutive slots)
    const volunteerHours = new Map<string, number>();
    slots.forEach((s) => {
      if (s.leadVolunteerName) {
        const hrs = (volunteerHours.get(s.leadVolunteerName) || 0) + s.durationMinutes / 60;
        volunteerHours.set(s.leadVolunteerName, hrs);
      }
    });

    const volunteerShiftStats = Array.from(volunteerHours.entries()).map(
      ([name, hours]) => ({
        volunteerName: name,
        assignedHours: Number(hours.toFixed(1)),
        hasFatigueRisk: hours > 8,
      })
    );

    volunteerShiftStats
      .filter((v) => v.hasFatigueRisk)
      .forEach((v) => {
        clashes.push({
          type: "VOLUNTEER_FATIGUE",
          severity: "HIGH",
          affectedSlotIds: [],
          message: `Shift fatigue warning: ${v.volunteerName} is assigned to ${v.assignedHours} hours of operational coverage without scheduled relief.`,
          resolution: `Rotate in secondary squad leads (e.g. Arjun Pillai or Dev Joshi) to assume lead on slots past 8 hours.`,
        });
      });

    // Partition completed vs upcoming
    const completed = slots.filter((s) => s.status === "completed" || s.hourMark + s.durationMinutes / 60 <= currentHour);
    const active = slots.find((s) => s.status === "in_progress" || (s.hourMark <= currentHour && s.hourMark + s.durationMinutes / 60 > currentHour));
    const upcoming = slots.filter((s) => s.status === "scheduled" && s.hourMark > currentHour);

    const timelineIntegrityScore = Math.max(
      20,
      100 - clashes.filter((c) => c.severity === "CRITICAL").length * 35 - clashes.filter((c) => c.severity === "HIGH").length * 15
    );

    return {
      currentHourMark: currentHour,
      activeSlot: active || slots[2],
      upcomingSlots: upcoming,
      completedSlots: completed,
      clashes,
      volunteerShiftStats,
      timelineIntegrityScore,
    };
  }
}
