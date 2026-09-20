# ClubOps AI

> **The Autonomous Role-Based Operations System for Collegiate Club Events & Large-Scale Hackathons**  
> Built for **Bit N Build Hackathon 2026** • Supporting 450+ Hackers across 112 Teams in Labs 301–304.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Vitest-62%20Passing-brightgreen?logo=vitest)](https://vitest.dev/)
[![Security](https://img.shields.io/badge/RBAC-Least--Privilege-indigo?logo=shield)](file:///d:/clubops%20ai/lib/permissions/index.ts)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](file:///d:/clubops%20ai/Dockerfile)

---

## 🎯 The Problem Statement

Organizing a 36-hour collegiate hackathon with 450 hackers, 112 teams, and 6 corporate sponsors is notoriously chaotic:
1. **Biased Judging**: Raw score averages are severely skewed by strict vs. lenient judges, resulting in unfair awards.
2. **Hacker Friction & Unanswered Help**: Mentors wander aimlessly without knowing where teams are physically seated or what tech stacks they use.
3. **Sponsor Commitment Dropping**: Organizers fail to track sponsor booth setups, workshop AV checks, and custom bounties in real time, jeopardizing renewals.
4. **Volunteer Fatigue & Room Clashes**: Ad-hoc scheduling leads to double-booked venues and exhausted volunteers working 12-hour shifts without relief.
5. **Security & Permission Creep**: Volunteer coordinators accidentally edit critical project budgets or view sensitive participant data.

---

## 💡 The Solution: ClubOps AI

**ClubOps AI** replaces fragmented spreadsheets and Discord chaos with an autonomous, mathematically rigorous operations control platform:

- 🏛️ **Hierarchical Role-Based Access Control (RBAC)**: Enforces least-privilege security across **Admin**, **Organizer**, and **Volunteer** personas.
- 🏆 **Gavel-Inspired Expo Judging & Normalization (`/judging`)**: Multi-criteria rubric (Technical 30%, Innovation 25%, Impact 25%, Demo 20%) with Z-score standard normalization to eliminate judge bias.
- 🙋 **HelpQ Floating Mentor Dispatch (`/mentors`)**: Real-time queue mapping tickets directly to physical table coordinates (e.g. `Lab 301, Table 4`) with specialty tech stack chips.
- 🤝 **Sponsor Deliverables & Bounty ROI Portal (`/sponsors`)**: Contract fulfillment checklists and live bounty tracking for **Devfolio**, **Polygon**, **GitHub**, **Red Bull**, **Cisco**, and **AWS**.
- ⏱️ **Master Run-of-Show Engine (`/planning`)**: 36-hour operational timeline with automated venue clash detection, volunteer fatigue alerts, and print-ready CSV exports.
- 🧮 **Algorithmic Intelligence (`/algorithms`)**: Critical Path Method (CPM) delay impact simulation, Kuhn-Munkres volunteer workload rebalancing, and Bayesian risk prediction.
- 🛡️ **Full Enterprise Security**: HTTP security headers, parameterized server-side route guards, document visibility segregation, and immutable audit logs.

---

## 👑 Role Hierarchy & Navigation Matrix

```
 CLUB ADMIN (Executive Authority)
      │
      ├── ORGANIZER (Squad & Workstream Lead)
      │         │
      │         └── VOLUNTEER (Task Execution & Proof-of-Work)
      │
      └── PARTICIPANTS / HACKERS (Expo, HelpQ, Run-of-Show)
```

| Route | Purpose | Admin | Organizer | Volunteer | Public / Hacker |
|---|---|:---:|:---:|:---:|:---:|
| `/auth/role` | Primary Role Selection Gate | ✅ | ✅ | ✅ | ✅ |
| `/war-room` | 36H Live War Room & Hardware Vitals | ✅ | ✅ | ✅ | ✅ |
| `/judging` | Project Expo & Calibrated Leaderboard | ✅ | ✅ | ✅ | ✅ |
| `/mentors` | HelpQ Floating Mentor Dispatch Queue | ✅ | ✅ | ✅ | ✅ |
| `/sponsors` | Sponsor Deliverables Checklist & ROI | ✅ | ✅ | ❌ | ❌ |
| `/planning` | 36-Hour Run-of-Show & Print Sheet | ✅ | ✅ | ✅ | ✅ |
| `/algorithms` | Critical Path & Workload Rebalancing | ✅ | ✅ | Read | ❌ |
| `/admin/*` | Global Projects, Squads, Settings, Audit | ✅ | ❌ | ❌ | ❌ |
| `/organizer/*`| Squad Projects, Task Operations, Volunteers | ✅ | ✅ | ❌ | ❌ |
| `/volunteer/*`| My Assigned Tasks, Proof-of-Work, Calendar | ✅ | ❌ | ✅ | ❌ |
| `/api/health` | Automated Production Health Probe | ✅ | ✅ | ✅ | ✅ |

---

## ⚡ Quickstart (Run on Any Laptop in 60 Seconds)

### Option 1: One-Click Launchers (No setup needed)
- **Windows**: Double-click `start.bat`
- **macOS / Linux**: Run `./start.sh` in terminal

These scripts automatically verify Node.js $\ge 18$, initialize `.env.local`, install dependencies if missing, launch the server, and open your browser to `http://localhost:3000`.

### Option 2: Standard Node.js Setup
```bash
# 1. Clone repository
git clone https://github.com/prinsladani7/ClubOps-AI.git
cd ClubOps-AI

# 2. Run automated environment pre-flight check
npm run doctor

# 3. Install dependencies & launch
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Container Deployment (Docker & Docker Compose)

Deploy anywhere in 1 command using the multi-stage, non-root Alpine container:

```bash
# Build and run container in background
docker compose up --build -d

# Verify container health probe
curl -i http://localhost:3000/api/health
```

---

## ☁️ Cloud 1-Click Deployment

### Deploy to Vercel
1. Fork or import this repository to GitHub: `https://github.com/prinsladani7/ClubOps-AI`.
2. Connect the repository in [Vercel](https://vercel.com/new).
3. The included `vercel.json` and `next.config.mjs` automatically configure:
   - Framework preset: `Next.js`
   - Build command: `npm run build`
   - Enterprise security headers & static asset caching
4. Click **Deploy**.

### Deploy to Railway / Render / Cloud Run
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Health Check Path**: `/api/health`
- **Port**: `3000`

---

## 🧪 Testing & Verification

ClubOps AI is backed by comprehensive automated test coverage:

```bash
# Run all 62 unit & integration tests (Vitest)
npm run test

# Run TypeScript compiler static check
npx tsc --noEmit

# Run full Next.js production build (68 static routes)
npm run build

# Run host laptop diagnostic check
npm run doctor
```

### Test Suites Included:
- `tests/cpm-algorithms.test.ts`: Critical Path Method and task delay impact simulations.
- `tests/judging-algorithm.test.ts`: Gavel Z-score multi-judge normalizer and tie-breakers.
- `tests/mentor-queue.test.ts`: HelpQ lifecycle, table coordinates, and sponsor deliverable toggles.
- `tests/workload-optimizer.test.ts`: Volunteer workload distribution and burn-out detection.
- `tests/rbac-teams.test.ts`: Team hierarchy, delegation chains, and acting organizer expiry.
- `tests/authorization-boundaries.test.ts`: Horizontal & vertical privilege escalation security guards.
- `tests/security-checks.test.ts`: Parameter tampering, document clearance tiers, and rate limiting.
- `tests/health.test.ts`: Production health probe endpoint verification.

---

## 🛡️ Enterprise Security & Data Integrity

- **Strict Server-Side Authorization**: Security checks occur at the API and database layer using `canAccessRoute` and `can(user, action, resource)`.
- **Zero Raw Coder Data**: Technical IDs, JSON dumps, and internal entity keys are replaced with humanized operational narratives.
- **Append-Only Audit Logs**: Every administrative action, task state change, and judge score is immutably recorded in the compliance audit trail.
- **SQL Schema & RLS Migrations**: Complete PostgreSQL schemas with Row-Level Security policies available under `supabase/migrations/`.

---

## 👥 Demo Personas for Evaluation

To test all roles without manual registration, use the 1-click persona switcher on `/auth/role` or `/login`:
- 🛡️ **Admin**: *Prins Patel* (`prins@syntaxsquad.edu`) — Full organizational clearance.
- 📋 **Organizer**: *Jay Mehta* (`jay@syntaxsquad.edu`) — Squad lead for Tech & Infrastructure.
- 🙋 **Volunteer**: *Rahul Verma* (`rahul@syntaxsquad.edu`) — Floor volunteer with assigned tasks.
- 🎓 **Hacker / Member**: Explore the live War Room, Expo Leaderboard, and HelpQ.

---

**Built with pride for Bit N Build Hackathon 2026.**
