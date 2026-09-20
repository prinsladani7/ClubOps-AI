"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Handshake,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  Gift,
  Building,
  DollarSign,
  Users,
  Briefcase,
  Flame,
  CheckSquare,
  Square,
  Sparkles,
  MapPin,
  TrendingUp,
  FileCheck,
  Plus,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { SponsorPartner, SponsorTier } from "@/types";

const ALL_TIERS: (SponsorTier | "ALL")[] = ["ALL", "title", "platinum", "gold", "silver"];

export default function SponsorsManagementPage() {
  const { sponsors, toggleSponsorDeliverable, createSponsor, showToast } = useClubOps();

  const [selectedTier, setSelectedTier] = useState<SponsorTier | "ALL">("ALL");
  const [activeTab, setActiveTab] = useState<"deliverables" | "bounties" | "roi">("deliverables");

  // Add Sponsor Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTier, setNewTier] = useState<SponsorTier>("gold");
  const [newBooth, setNewBooth] = useState("Expo Floor, Booth 1");
  const [newBountyTitle, setNewBountyTitle] = useState("");
  const [newBountyPrize, setNewBountyPrize] = useState("$1,000 Cash");

  const handleAddSponsor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    createSponsor({
      name: newName.trim(),
      tier: newTier,
      booth_location: newBooth.trim(),
      custom_bounty_title: newBountyTitle.trim() || undefined,
      custom_bounty_prize: newBountyTitle.trim() ? newBountyPrize.trim() : undefined,
    });

    setIsAddModalOpen(false);
    setNewName("");
    setNewBountyTitle("");
  };

  const filteredSponsors = useMemo(() => {
    if (selectedTier === "ALL") return sponsors;
    return sponsors.filter((s) => s.tier === selectedTier);
  }, [sponsors, selectedTier]);

  // Deliverables metrics
  const totalDeliverables = useMemo(() => {
    return sponsors.reduce((sum, s) => sum + s.deliverables.length, 0);
  }, [sponsors]);

  const completedDeliverables = useMemo(() => {
    return sponsors.reduce(
      (sum, s) => sum + s.deliverables.filter((d) => d.completed).length,
      0
    );
  }, [sponsors]);

  const completionPercentage = totalDeliverables > 0
    ? Math.round((completedDeliverables / totalDeliverables) * 100)
    : 0;

  const totalBountySubmissions = useMemo(() => {
    return sponsors.reduce((sum, s) => sum + (s.bounty_submissions_count || 0), 0);
  }, [sponsors]);

  const handleToggle = (sponsorId: string, deliverableId: string, title: string) => {
    toggleSponsorDeliverable(sponsorId, deliverableId);
  };

  const getTierBadge = (tier: SponsorTier) => {
    switch (tier) {
      case "title":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      case "platinum":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
      case "gold":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      case "silver":
        return "bg-slate-400/20 text-slate-300 border-slate-400/40";
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Sponsor Operations Active
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              $18,500 Total Prize & Grant Pool
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Handshake className="w-8 h-8 text-indigo-400" />
            Sponsor Deliverables & Bounty ROI Portal
          </h1>
          <p className="text-slate-400 mt-1 max-w-2xl text-sm leading-relaxed">
            Ensure 100% fulfillment of contractual commitments for Bit N Build 2026 partners (Devfolio, Polygon, GitHub, Red Bull, Cisco, AWS). Real-time bounty submissions and booth operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            Add Sponsor Partner
          </button>

          <Link
            href="/judging"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-sm font-medium transition-all"
          >
            <Award className="w-4 h-4 text-yellow-400" />
            Judging Expo
          </Link>
          <Link
            href="/war-room"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-sm font-medium transition-all"
          >
            <Flame className="w-4 h-4 text-indigo-400" />
            War Room
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Partner Sponsors</span>
            <Building className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{sponsors.length} Companies</div>
          <p className="text-xs text-slate-400 mt-1">Devfolio, Polygon, GitHub & more</p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Contract Deliverables</span>
            <FileCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {completedDeliverables} / {totalDeliverables} ({completionPercentage}%)
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-yellow-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Bounty Prize Value</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-yellow-400">$18,500</div>
          <p className="text-xs text-yellow-300/80 mt-1">Direct cash, grants, & credits</p>
        </div>

        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-indigo-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Bounty Submissions</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-indigo-400">{totalBountySubmissions} Teams</div>
          <p className="text-xs text-indigo-300/80 mt-1">Hacker projects targeting sponsor tracks</p>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        {/* Tier Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {ALL_TIERS.map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase whitespace-nowrap transition-all ${
                selectedTier === tier
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                  : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {tier === "ALL" ? "All Sponsors" : `${tier} Tier`}
            </button>
          ))}
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900/80 border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("deliverables")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "deliverables"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Deliverables Checklist
          </button>
          <button
            onClick={() => setActiveTab("bounties")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "bounties"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Custom Bounties
          </button>
          <button
            onClick={() => setActiveTab("roi")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "roi"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            ROI & Engagement
          </button>
        </div>
      </div>

      {/* TAB 1: DELIVERABLES CHECKLIST */}
      {activeTab === "deliverables" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSponsors.length === 0 ? (
            <div className="col-span-full p-12 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <Handshake className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-white">No sponsor partners registered</h3>
                <p className="text-xs text-slate-400">
                  Add sponsor companies to track deliverables, booth setup, swag distribution, and workshops.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                + Add Sponsor Partner
              </button>
            </div>
          ) : (
            filteredSponsors.map((sponsor) => {
              const completedCount = sponsor.deliverables.filter((d) => d.completed).length;
              const pct = Math.round((completedCount / sponsor.deliverables.length) * 100);

              return (
              <div
                key={sponsor.id}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm flex flex-col justify-between space-y-5"
              >
                <div>
                  {/* Top Sponsor Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white">{sponsor.name}</h3>
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${getTierBadge(
                            sponsor.tier
                          )}`}
                        >
                          {sponsor.tier}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                        {sponsor.booth_location}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-white">
                        {completedCount} / {sponsor.deliverables.length}
                      </div>
                      <div className="text-xs text-slate-500">Fulfilled ({pct}%)</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-4">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Deliverables Checklist */}
                  <div className="space-y-2.5">
                    {sponsor.deliverables.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleToggle(sponsor.id, item.id, item.title)}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${
                          item.completed
                            ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40"
                            : "bg-slate-800/40 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/60"
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {item.completed ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500 hover:text-slate-300" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-sm font-medium ${
                                item.completed
                                  ? "line-through text-slate-400"
                                  : "text-slate-200"
                              }`}
                            >
                              {item.title}
                            </span>
                            {item.due_time && (
                              <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                {item.due_time}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase bg-slate-700 text-slate-300">
                              {item.category}
                            </span>
                            {item.notes && (
                              <span className="text-xs text-slate-400 italic">
                                {item.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bounty snippet footer */}
                {sponsor.custom_bounty_title && (
                  <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 truncate">
                      <Gift className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                      {sponsor.custom_bounty_title}
                    </span>
                    <span className="font-bold text-yellow-400 font-mono ml-2 shrink-0">
                      {sponsor.custom_bounty_prize}
                    </span>
                  </div>
                )}
              </div>
            );
          })
          )}
        </div>
      )}

      {/* TAB 2: CUSTOM BOUNTIES */}
      {activeTab === "bounties" && (
        <div className="space-y-4">
          <div className="text-sm text-slate-300 mb-2">
            Targeted partner bounty tracks offered to all 112 hackathon teams:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sponsors.filter((s) => s.custom_bounty_title).length === 0 ? (
              <div className="col-span-full p-12 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center mx-auto">
                  <Gift className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-base font-bold text-white">No custom sponsor bounties posted</h3>
                  <p className="text-xs text-slate-400">
                    Add partner sponsors with custom bounty prize tracks to incentivize hackers on targeted technologies.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  + Add Sponsor Partner
                </button>
              </div>
            ) : (
              sponsors
                .filter((s) => s.custom_bounty_title)
                .map((sponsor) => (
                  <div
                    key={sponsor.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between backdrop-blur-sm space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${getTierBadge(
                            sponsor.tier
                          )}`}
                        >
                          {sponsor.name}
                        </span>
                        <span className="font-mono font-bold text-sm text-yellow-400 bg-yellow-400/10 px-2.5 py-0.5 rounded border border-yellow-400/30">
                          {sponsor.custom_bounty_prize}
                        </span>
                      </div>

                      <h4 className="text-lg font-bold text-white mb-2">
                        {sponsor.custom_bounty_title}
                      </h4>

                      <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        Evaluated during Sunday morning Expo judging by sponsor representatives stationed at {sponsor.booth_location}.
                      </p>
                    </div>

                    <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        {sponsor.bounty_submissions_count || 0} Submissions
                      </span>
                      <Link
                        href="/judging"
                        className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                      >
                        View in Expo →
                      </Link>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ROI & ENGAGEMENT MATRIX */}
      {activeTab === "roi" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Sponsor Value Realization & Engagement Telemetry
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Data compiled from hacker check-in RFID logs, workshop attendance scanners, and HelpQ mentor dispatch records.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Partner Sponsor</th>
                  <th className="py-3 px-4">Tier</th>
                  <th className="py-3 px-4">Booth Foot Traffic</th>
                  <th className="py-3 px-4">Workshop Attendees</th>
                  <th className="py-3 px-4">Bounty Projects</th>
                  <th className="py-3 px-4">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {sponsors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <Handshake className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-300">No sponsor partners registered yet</p>
                      <p className="text-xs text-slate-500 mt-1">Add sponsor partners to start monitoring engagement, deliverables, and ROI.</p>
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="mt-3 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                      >
                        + Add Sponsor Partner
                      </button>
                    </td>
                  </tr>
                ) : (
                  sponsors.map((s) => {
                    const completed = s.deliverables.filter((d) => d.completed).length;
                    const total = s.deliverables.length;
                    const isFull = completed === total;

                    return (
                      <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{s.name}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold uppercase border ${getTierBadge(
                              s.tier
                            )}`}
                          >
                            {s.tier}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {s.tier === "title" ? "340+ hackers" : s.tier === "platinum" ? "210+ hackers" : "120+ hackers"}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {s.tier === "title" ? "94 hackers (Packed)" : s.tier === "platinum" ? "68 hackers" : "N/A"}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-yellow-400">
                          {s.bounty_submissions_count ? `${s.bounty_submissions_count} teams` : "General Track"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isFull
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {completed}/{total} Deliverables
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD SPONSOR PARTNER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl relative my-8 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-5">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Bit N Build 2026 Partner
                </span>
                <h3 className="text-xl font-bold text-white mt-1.5">Add Sponsor Partner</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track deliverables, booth logistics, and custom prize bounties.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSponsor} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Company / Partner Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GitHub, AWS, Polygon"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Partnership Tier *</label>
                  <select
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value as SponsorTier)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 capitalize"
                  >
                    <option value="title">Title Sponsor</option>
                    <option value="platinum">Platinum</option>
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Booth Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Foyer, Booth 2"
                    value={newBooth}
                    onChange={(e) => setNewBooth(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Custom Bounty Track Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Best Full-Stack Application Using API"
                  value={newBountyTitle}
                  onChange={(e) => setNewBountyTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {newBountyTitle && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Bounty Prize Award</label>
                  <input
                    type="text"
                    placeholder="e.g. $1,500 Cash + Cloud Credits"
                    value={newBountyPrize}
                    onChange={(e) => setNewBountyPrize(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
                >
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
