import React, { useState, useEffect } from "react";
import { 
  Landmark, 
  Sparkles, 
  FileText, 
  ChevronRight, 
  BookmarkCheck, 
  Zap, 
  RefreshCw, 
  Star, 
  Users, 
  Trophy, 
  MapPin, 
  Search, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Activity, 
  Globe, 
  Flame, 
  AlertCircle,
  Clock,
  ShieldAlert,
  HelpCircle
} from "lucide-react";
import { Accomplishment, LegislatorScorecard, DailyBrief, KeyIssue } from "../types";

interface DashboardProps {
  accomplishments: Accomplishment[];
  onSelectBill: (id: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  watchlist: string[];
  toggleWatchlist: (id: string) => void;
  followedLegislators: string[];
  toggleFollowLegislator: (id: string) => void;
  selectedLocalState: string;
  onNavigateToTab?: (tab: string) => void;
  onStateChange?: (stateCode: string) => void;
}

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming"
};

// National Media Focus Battleground States
const MEDIA_STATES = [
  { code: "TX", reason: "Border policies, Energy independence, and Infrastructure grids" },
  { code: "FL", reason: "Homeowners insurance regulation, Climate readiness, and Consumer affairs" },
  { code: "GA", reason: "Voting accessibility, Municipal development grants, and Agricultural support" },
  { code: "MI", reason: "Automotive innovation, Great Lakes clean energy subsidies, and Union protections" },
  { code: "PA", reason: "Shale natural gas regulations, Manufacturing tech corridors, and Bridge restoration" }
];

// Key Standing Committees of Congress
const STANDING_COMMITTEES = [
  { 
    id: "senate-foreign", 
    name: "Senate Committee on Foreign Relations", 
    chamber: "Senate", 
    desc: "Oversees foreign policy, treaty reviews, state department ambassadors, and foreign aid programs.",
    tags: ["Foreign Policy", "Defense Agreements"]
  },
  { 
    id: "senate-finance", 
    name: "Senate Committee on Finance", 
    chamber: "Senate", 
    desc: "Governs taxation, customs, trade tariffs, Medicare/Medicaid oversight, and the Social Security safety net.",
    tags: ["Taxation", "Trade Tariffs"]
  },
  { 
    id: "house-appropriations", 
    name: "House Committee on Appropriations", 
    chamber: "House", 
    desc: "Responsible for writing legislation that allocates federal funds to agencies and emergency spending directives.",
    tags: ["Discretionary Spending", "Budget Allocations"]
  },
  { 
    id: "house-judiciary", 
    name: "House Committee on the Judiciary", 
    chamber: "House", 
    desc: "Covers constitutional questions, federal court nominations, anti-trust laws, and civil liberties statutes.",
    tags: ["Constitutional Law", "Court Oversight"]
  },
  { 
    id: "senate-armed", 
    name: "Senate Committee on Armed Services", 
    chamber: "Senate", 
    desc: "Handles defense budget authorizations, strategic deterrence, and military equipment operations.",
    tags: ["National Defense", "Military Briefs"]
  },
  { 
    id: "house-commerce", 
    name: "House Committee on Energy and Commerce", 
    chamber: "House", 
    desc: "One of the broadest jurisdictions: telecom, public health programs, food/drug safety, and energy projects.",
    tags: ["Consumer Protections", "Public Health"]
  }
];

export default function Dashboard({
  accomplishments,
  onSelectBill,
  onRefresh,
  isLoading,
  watchlist,
  toggleWatchlist,
  followedLegislators = [],
  toggleFollowLegislator,
  selectedLocalState,
  onNavigateToTab,
  onStateChange
}: DashboardProps) {
  const [legislators, setLegislators] = useState<LegislatorScorecard[]>([]);
  const [loadingLegs, setLoadingLegs] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<"daily" | "jurisdiction" | "federal" | "directory">("daily");

  // Daily Brief & Key Issues States
  const [dailyBrief, setDailyBrief] = useState<DailyBrief | null>(null);
  const [keyIssues, setKeyIssues] = useState<KeyIssue[]>([]);
  const [loadingBrief, setLoadingBrief] = useState<boolean>(false);
  const [loadingIssues, setLoadingIssues] = useState<boolean>(false);
  const [followedIssues, setFollowedIssues] = useState<string[]>(() => {
    const saved = localStorage.getItem("capitol_followed_issues");
    return saved ? JSON.parse(saved) : ["issue-ai-safety", "issue-clean-energy"];
  });

  const toggleFollowIssue = (issueId: string) => {
    setFollowedIssues(prev => {
      const updated = prev.includes(issueId)
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId];
      localStorage.setItem("capitol_followed_issues", JSON.stringify(updated));
      return updated;
    });
  };

  // Load Daily Brief & Key Issues
  useEffect(() => {
    async function fetchDailyBrief() {
      try {
        setLoadingBrief(true);
        const resp = await fetch("/api/legislation/daily-brief");
        const json = await resp.json();
        setDailyBrief(json.data);
      } catch (err) {
        console.error("Failed to load daily brief:", err);
      } finally {
        setLoadingBrief(false);
      }
    }

    async function fetchKeyIssues() {
      try {
        setLoadingIssues(true);
        const resp = await fetch("/api/legislation/key-issues");
        const json = await resp.json();
        setKeyIssues(json.data || []);
      } catch (err) {
        console.error("Failed to load key issues:", err);
      } finally {
        setLoadingIssues(false);
      }
    }

    fetchDailyBrief();
    fetchKeyIssues();
  }, []);

  // Directory Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [chamberFilter, setChamberFilter] = useState<"ALL" | "House" | "Senate">("ALL");
  const [partyFilter, setPartyFilter] = useState<"ALL" | "D" | "R">("ALL");
  const [stateFilter, setStateFilter] = useState<string>("ALL");
  const [sortFilter, setSortFilter] = useState<"NAME" | "WORST_GRADE" | "BEST_GRADE" | "ATTENDANCE">("NAME");
  const [directoryPage, setDirectoryPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Collapsed states for voting histories of individual legislators (key: legId, val: boolean)
  const [expandedLegVotes, setExpandedLegVotes] = useState<Record<string, boolean>>({});

  // Active Selected Committee for the Federal tab view
  const [selectedCommittee, setSelectedCommittee] = useState<string | null>(null);

  // Load all current legislators from the parsed csv endpoint
  useEffect(() => {
    async function loadLegislators() {
      try {
        setLoadingLegs(true);
        const resp = await fetch("/api/legislation/legislators");
        const resJson = await resp.json();
        setLegislators(resJson.data || []);
      } catch (err) {
        console.error("Failed to load legislators in dashboard widget:", err);
      } finally {
        setLoadingLegs(false);
      }
    }
    loadLegislators();
  }, []);

  const toggleExpandVotes = (legId: string) => {
    setExpandedLegVotes(prev => ({
      ...prev,
      [legId]: !prev[legId]
    }));
  };

  // ----------------------------------------------------
  // DATA FILTERING & SORTING
  // ----------------------------------------------------
  
  // 1. Local State Representatives
  const localRepresentatives = legislators.filter(l => l.state === selectedLocalState);
  
  // 2. Politicians Directory Filtered List
  const filteredLegislators = legislators
    .filter(l => {
      const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            l.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesChamber = chamberFilter === "ALL" || l.chamber === chamberFilter;
      const matchesParty = partyFilter === "ALL" || l.party === partyFilter;
      const matchesState = stateFilter === "ALL" || l.state === stateFilter;
      return matchesSearch && matchesChamber && matchesParty && matchesState;
    })
    .sort((a, b) => {
      if (sortFilter === "WORST_GRADE") {
        const scoreA = a.libertyProsperityIndex?.overallScore ?? 70;
        const scoreB = b.libertyProsperityIndex?.overallScore ?? 70;
        return scoreA - scoreB;
      }
      if (sortFilter === "BEST_GRADE") {
        const scoreA = a.libertyProsperityIndex?.overallScore ?? 70;
        const scoreB = b.libertyProsperityIndex?.overallScore ?? 70;
        return scoreB - scoreA;
      }
      if (sortFilter === "ATTENDANCE") {
        return b.attendanceRate - a.attendanceRate;
      }
      return a.name.localeCompare(b.name);
    });

  const totalPages = Math.ceil(filteredLegislators.length / itemsPerPage);
  const paginatedLegislators = filteredLegislators.slice(
    (directoryPage - 1) * itemsPerPage,
    directoryPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setDirectoryPage(1);
  }, [searchTerm, chamberFilter, partyFilter, stateFilter, sortFilter]);

  // 3. Find legislators on the selected Standing Committee
  const committeeMembers = selectedCommittee 
    ? legislators.filter(l => l.committees?.includes(selectedCommittee))
    : [];

  const getFullStateName = (code: string) => STATE_NAMES[code] || `State of ${code}`;

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------
          HERO BANNER & PROFILE SELECTOR (NEWS DESK MASTHEAD BANNER)
         ---------------------------------------------------- */}
      <div className="bg-[#FAF7F0] p-6 sm:p-8 border-y-4 border-double border-[#1A1A1A] relative overflow-hidden shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 bg-[#1A1A1A] text-[#FBF9F5] text-[10px] font-mono tracking-widest font-bold uppercase">
              <Zap className="h-3 w-3 text-amber-400" />
              <span>THE CITIZENS SENTINEL • EDITORIAL DESK</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-headline font-black text-[#1A1A1A] tracking-tight leading-tight">
              119th Congress Broadsheet Intelligence
            </h1>
            <p className="font-serif text-stone-700 text-xs sm:text-sm leading-relaxed max-w-3xl">
              Un-biased congressional reporting, plain-language legislative translations, roll call bulletins, and bipartisan consensus scorecards for everyday citizens.
            </p>
          </div>

          {/* Dateline badge */}
          <div className="sepia-stamp self-start md:self-center shrink-0">
            ★ VERIFIED CONGRESSIONAL DATA ★
          </div>
        </div>

        {/* Real-Time Session Status indicator bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 bg-[#F5F2EA] p-3.5 border border-[#1A1A1A]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#1A1A1A] text-[#FBF9F5]">
              <Landmark className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[9px] font-mono text-stone-600 font-bold uppercase tracking-widest">House of Representatives</div>
              <div className="text-xs font-serif font-bold text-[#1A1A1A] mt-0.5 flex items-center space-x-2">
                <span>Floor Proceedings Active</span>
                <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block animate-pulse"></span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 border-t sm:border-t-0 sm:border-l border-stone-300 pt-3 sm:pt-0 sm:pl-4">
            <div className="p-2 bg-[#1A1A1A] text-[#FBF9F5]">
              <Landmark className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[9px] font-mono text-stone-600 font-bold uppercase tracking-widest">United States Senate</div>
              <div className="text-xs font-serif font-bold text-[#1A1A1A] mt-0.5 flex items-center space-x-2">
                <span>Executive Session & Debates</span>
                <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block animate-pulse"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          SUB-NAVIGATION (Broadsheet Edition Tabs)
         ---------------------------------------------------- */}
      <div className="flex flex-wrap border-b-2 border-[#1A1A1A] bg-[#FAF7F0] p-1 gap-1">
        <button
          onClick={() => setActiveSubTab("daily")}
          className={`flex-1 min-w-[150px] py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === "daily"
              ? "bg-[#1A1A1A] text-[#FBF9F5] shadow-xs"
              : "text-stone-800 hover:bg-stone-200/80"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Daily Briefing Front Page</span>
        </button>

        <button
          onClick={() => setActiveSubTab("federal")}
          className={`flex-1 min-w-[150px] py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === "federal"
              ? "bg-[#1A1A1A] text-[#FBF9F5] shadow-xs"
              : "text-stone-800 hover:bg-stone-200/80"
          }`}
        >
          <Landmark className="h-4 w-4" />
          <span>Committees & Jurisdiction</span>
        </button>

        <button
          onClick={() => setActiveSubTab("directory")}
          className={`flex-1 min-w-[150px] py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === "directory"
              ? "bg-[#1A1A1A] text-[#FBF9F5] shadow-xs"
              : "text-stone-800 hover:bg-stone-200/80"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Congressional Roster ({legislators.length})</span>
        </button>
      </div>

      {/* ----------------------------------------------------
          TAB 0: DAILY BRIEFING HQ (3-COLUMN EDITORIAL FRONT PAGE)
         ---------------------------------------------------- */}
      {activeSubTab === "daily" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* ====================================================
              LEFT COLUMN (3 Cols): EXTRA! EXTRA! ROLL CALL BULLETINS
             ==================================================== */}
          <div className="lg:col-span-3 space-y-5 border-r-0 lg:border-r border-stone-300 lg:pr-5">
            <div className="bg-[#FAF7F0] border-2 border-[#1A1A1A] p-4 shadow-2xs space-y-4">
              <div className="border-b-2 border-[#1A1A1A] pb-2">
                <span className="sepia-stamp-rose mb-1.5">
                  ★ URGENT WIRE BULLETIN ★
                </span>
                <h3 className="text-sm font-headline font-black text-[#1A1A1A] uppercase tracking-wide mt-1">
                  EXTRA! EXTRA! Roll Call Bulletins
                </h3>
                <p className="text-[11px] font-serif text-stone-600 mt-1 leading-snug">
                  Breaking legislative votes, active floor roll calls, and committee tallies.
                </p>
              </div>

              {/* Bulletins List */}
              <div className="space-y-3 font-serif">
                {accomplishments && accomplishments.length > 0 ? (
                  accomplishments.slice(0, 4).map((item, i) => (
                    <div 
                      key={item.id}
                      onClick={() => onSelectBill(item.id)}
                      className="p-3 bg-[#F5F2EA] border border-[#1A1A1A] hover:bg-stone-200/60 transition-colors cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-[#1A1A1A] bg-stone-300/80 px-1.5 py-0.5">
                          {item.id}
                        </span>
                        <span className="sepia-stamp-emerald text-[9px]">
                          {item.outcome || "VOTED"}
                        </span>
                      </div>
                      <h4 className="text-xs font-headline font-bold text-[#1A1A1A] leading-snug hover:underline">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-stone-700 line-clamp-2 leading-relaxed">
                        {item.synopsis}
                      </p>
                      <div className="pt-1.5 border-t border-stone-300 text-[9.5px] font-mono font-bold text-stone-600 flex justify-between items-center">
                        <span>TALLY: PASS</span>
                        <span className="text-amber-800 hover:underline flex items-center gap-0.5">
                          Proof Sheet <ChevronRight className="h-3 w-3 inline" />
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs font-mono text-stone-500 italic p-4 text-center">
                    Loading roll call wire...
                  </div>
                )}
              </div>

              {/* Extra Newspaper Box */}
              <div className="p-3 bg-[#1A1A1A] text-[#FBF9F5] text-xs font-serif space-y-1.5">
                <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                  CAPITOL TELETYPE
                </span>
                <p className="text-[11px] text-stone-300 leading-snug">
                  119th Congress floor debate schedule updated every hour via grounded GovTrack & Congress feeds.
                </p>
              </div>
            </div>
          </div>

          {/* ====================================================
              CENTER COLUMN (6 Cols): EXECUTIVE SUMMARY LEAD STORY WITH DROP CAPS
             ==================================================== */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-[#FAF7F0] border-2 border-[#1A1A1A] p-6 shadow-xs space-y-5">
              
              {/* Lead Story Header */}
              <div className="border-b-4 border-double border-[#1A1A1A] pb-4 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-stone-700 uppercase tracking-widest">
                  <span className="bg-[#1A1A1A] text-[#FBF9F5] px-2 py-0.5">FRONT PAGE LEAD STORY</span>
                  <span>THE DAILY CIVIC WATCHDOG</span>
                </div>

                {dailyBrief ? (
                  <h2 className="text-xl sm:text-2xl font-headline font-black text-[#1A1A1A] leading-tight mt-2">
                    &ldquo;{dailyBrief.headline}&rdquo;
                  </h2>
                ) : (
                  <h2 className="text-xl font-headline font-black text-[#1A1A1A]">
                    Key Legislative Reform Active on Floor of the 119th Congress
                  </h2>
                )}
              </div>

              {/* Main Story Content with Drop Caps */}
              {loadingBrief ? (
                <div className="py-12 text-center text-stone-600 flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="h-8 w-8 text-[#1A1A1A] animate-spin" />
                  <span className="text-xs font-mono font-bold">Press Bureau compiling lead story...</span>
                </div>
              ) : dailyBrief ? (
                <div className="space-y-4 font-serif text-sm text-[#1A1A1A]">
                  
                  {/* Lead Paragraph with Drop Cap */}
                  <p className="drop-cap-lead text-stone-800 text-sm sm:text-base leading-relaxed font-serif">
                    {dailyBrief.summary}
                  </p>

                  {/* Editorial Analysis Breakdown */}
                  <div className="p-4 bg-[#F5F2EA] border-l-4 border-[#1A1A1A] space-y-2 my-4">
                    <h3 className="text-xs font-mono font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-800" />
                      Executive Summary & Key Takeaways
                    </h3>
                    <ul className="space-y-2 pt-1">
                      {dailyBrief.keyTakeaways.map((takeaway, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs font-serif text-stone-800 leading-relaxed">
                          <span className="font-mono font-bold text-[#1A1A1A] shrink-0">[{idx + 1}]</span>
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Scheduled Floor Agenda */}
                  <div className="pt-3 border-t-2 border-stone-300">
                    <h3 className="text-xs font-headline font-extrabold text-[#1A1A1A] uppercase tracking-wider mb-3">
                      Today&apos;s Active Floor Agenda & Hearings
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {dailyBrief.scheduledItems.map((item, idx) => (
                        <div key={idx} className="p-3 bg-[#F5F2EA] border border-[#1A1A1A] text-left flex flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-[#1A1A1A] text-[#FBF9F5] uppercase">
                                {item.chamber}
                              </span>
                              <span className="text-[9.5px] font-mono font-bold text-stone-600">{item.time}</span>
                            </div>
                            <p className="text-xs font-headline font-bold text-[#1A1A1A] mt-1 leading-snug">
                              {item.topic}
                            </p>
                          </div>
                          <div className="mt-2 pt-2 border-t border-stone-300 flex items-center justify-between text-[10px] font-mono">
                            <span className="sepia-stamp text-[8px]">{item.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-xs font-mono text-stone-500 italic text-center py-6">
                  No briefing available.
                </div>
              )}

              {/* Recently Voted Legislation Feature */}
              <div className="pt-4 border-t-4 border-double border-[#1A1A1A] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-headline font-black text-[#1A1A1A]">
                    Featured Legislative Enactments
                  </h3>
                  <span className="text-[10px] font-mono text-stone-600 uppercase font-bold">CLICK TO INSPECT</span>
                </div>

                <div className="space-y-2.5">
                  {accomplishments && accomplishments.length > 0 ? (
                    accomplishments.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onSelectBill(item.id)}
                        className="group p-3.5 bg-[#F5F2EA] hover:bg-stone-200/70 border border-[#1A1A1A] transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-[#1A1A1A] bg-stone-300 px-1.5 py-0.5">
                              {item.id}
                            </span>
                            <span className="text-[9px] font-mono text-stone-700 font-bold uppercase">
                              {item.category}
                            </span>
                          </div>
                          <h4 className="text-xs font-headline font-extrabold text-[#1A1A1A] group-hover:underline truncate">
                            {item.title}
                          </h4>
                          <p className="text-[11px] font-serif text-stone-700 line-clamp-1 leading-snug">
                            {item.synopsis}
                          </p>
                        </div>
                        <div className="sepia-stamp-emerald shrink-0">
                          PROOF SHEET →
                        </div>
                      </div>
                    ))
                  ) : null}
                </div>
              </div>

            </div>
          </div>

          {/* ====================================================
              RIGHT COLUMN (3 Cols): EDITORIAL BOARD CONSENSUS SCORES
             ==================================================== */}
          <div className="lg:col-span-3 space-y-5 border-l-0 lg:border-l border-stone-300 lg:pl-5">
            <div className="bg-[#FAF7F0] border-2 border-[#1A1A1A] p-4 shadow-2xs space-y-4">
              
              <div className="border-b-2 border-[#1A1A1A] pb-2">
                <span className="sepia-stamp text-[9px] mb-1.5">
                  CIVIC SCORECARD
                </span>
                <h3 className="text-sm font-headline font-black text-[#1A1A1A] uppercase tracking-wide mt-1">
                  Editorial Board Consensus Scores
                </h3>
                <p className="text-[11px] font-serif text-stone-600 mt-1 leading-snug">
                  Bipartisan alignment index and public interest sentiment scores on active issues.
                </p>
              </div>

              {/* Key Issues Tracker with Editorial Consensus Meters */}
              {loadingIssues ? (
                <div className="py-10 text-center text-stone-500 font-mono text-xs italic">
                  Syncing consensus metrics...
                </div>
              ) : keyIssues.length > 0 ? (
                <div className="space-y-3.5">
                  {keyIssues.map((issue) => {
                    const isFollowed = followedIssues.includes(issue.id);
                    return (
                      <div 
                        key={issue.id}
                        className={`p-3 border transition-all space-y-2.5 font-serif ${
                          isFollowed 
                            ? "bg-[#F5F2EA] border-2 border-[#1A1A1A]" 
                            : "bg-[#FAF7F0] border border-stone-300 hover:border-[#1A1A1A]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 bg-[#1A1A1A] text-[#FBF9F5]">
                              {issue.category}
                            </span>
                            <h4 className="text-xs font-headline font-bold text-[#1A1A1A] mt-1.5 leading-snug">
                              {issue.title}
                            </h4>
                          </div>
                          <button
                            onClick={() => toggleFollowIssue(issue.id)}
                            className={`p-1 border transition-all cursor-pointer ${
                              isFollowed
                                ? "bg-[#1A1A1A] text-amber-400 border-[#1A1A1A]"
                                : "bg-stone-100 border-stone-300 text-stone-500 hover:text-stone-900"
                            }`}
                            title={isFollowed ? "Unfollow issue" : "Follow issue"}
                          >
                            <Star className={`h-3 w-3 ${isFollowed ? "fill-amber-400" : ""}`} />
                          </button>
                        </div>

                        <p className="text-[11px] text-stone-700 leading-relaxed">
                          {issue.description}
                        </p>

                        {/* Editorial Consensus Meter */}
                        <div className="space-y-1 pt-1 border-t border-stone-300/80">
                          <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                            <span className="text-stone-600 uppercase">Consensus Index:</span>
                            <span className="text-[#1A1A1A]">{issue.consensus}%</span>
                          </div>
                          <div className="h-2 w-full bg-stone-200 border border-stone-400">
                            <div 
                              className="h-full bg-[#1A1A1A]" 
                              style={{ width: `${issue.consensus}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Collapsible Viewpoints */}
                        {isFollowed && (
                          <div className="pt-2 border-t border-stone-300 space-y-2 text-[10px] animate-fade-in">
                            <div className="bg-[#FAF7F0] p-2 border border-stone-300">
                              <span className="font-mono font-bold text-[#1A1A1A] block uppercase text-[8px]">PRO ARGUMENT:</span>
                              <p className="text-stone-700 italic mt-0.5">{issue.viewpoints.pro}</p>
                            </div>
                            <div className="bg-[#FAF7F0] p-2 border border-stone-300">
                              <span className="font-mono font-bold text-[#1A1A1A] block uppercase text-[8px]">CON ARGUMENT:</span>
                              <p className="text-stone-700 italic mt-0.5">{issue.viewpoints.con}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* Non-partisan Press Notice */}
              <div className="p-3 bg-[#F5F2EA] border border-stone-400 text-[10.5px] font-serif text-stone-800 space-y-1">
                <span className="font-mono font-bold text-[#1A1A1A] block uppercase text-[9px]">
                  EDITORIAL STANDARDS
                </span>
                <p className="leading-snug">
                  The Citizens Sentinel reports un-biased legislative parameters direct from official congressional journals.
                </p>
              </div>

            </div>
          </div>

        </div>
      )}



      {/* ----------------------------------------------------
          TAB 2: FEDERAL GOVERNMENT & COMMITTEES
         ---------------------------------------------------- */}
      {activeSubTab === "federal" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity and Accomplishments (Left 2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent activity accomplishments feed */}
            <div className="bg-[#F9F8F6] border-2 border-stone-900 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="space-y-1">
                  <h2 className="text-base font-display font-black text-stone-900 flex items-center gap-2">
                    <BookmarkCheck className="h-5 w-5 text-amber-600" />
                    Federal Recent Bills & Daily Accomplishments
                  </h2>
                  <p className="text-xs text-stone-500">Real-world results, approved codes, and plain-language impact breakdowns.</p>
                </div>
                <button
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-stone-100 rounded-none text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  {isLoading ? "Querying Live Grid..." : "Sync Live Data"}
                </button>
              </div>

              <div className="space-y-4">
                {accomplishments.length === 0 ? (
                  <div className="py-12 text-center text-stone-400 text-xs italic">
                    No recent activities returned. Try checking internet parameters or press &apos;Sync Live Data&apos;.
                  </div>
                ) : (
                  accomplishments.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="bg-stone-50 hover:bg-stone-100/60 border border-stone-200/90 p-4.5 rounded-none transition-all shadow-sm flex flex-col sm:flex-row gap-4 justify-between"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/15">
                            {item.id}
                          </span>
                          <span className="text-[9.5px] font-mono bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-semibold">
                            {item.category}
                          </span>
                          <span className="text-[9.5px] font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold border border-emerald-100">
                            {item.outcome}
                          </span>
                        </div>
                        
                        <h3 className="text-sm font-bold text-stone-900 hover:text-amber-600 cursor-pointer mt-1" onClick={() => onSelectBill(item.id)}>
                          {item.title}
                        </h3>
                        
                        <p className="text-xs text-stone-500 line-clamp-2">
                          {item.synopsis}
                        </p>

                        <div className="bg-[#F9F8F6] p-2.5 rounded border border-stone-200 text-[10.5px] text-stone-600 leading-normal">
                          <span className="font-bold text-stone-800 text-[11px] block mb-0.5">Real-World Outcome & Impact:</span>
                          {item.impact}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 flex-shrink-0">
                        <button
                          onClick={() => toggleWatchlist(item.id)}
                          className={`p-1.5 rounded border cursor-pointer transition-all ${
                            watchlist.includes(item.id)
                              ? "bg-amber-50 border-amber-200 text-amber-600"
                              : "bg-[#F9F8F6] border-stone-200 text-stone-400 hover:text-stone-600"
                          }`}
                          title="Bookmark Bill"
                        >
                          <Star className={`h-4 w-4 ${watchlist.includes(item.id) ? "fill-amber-500" : ""}`} />
                        </button>

                        <button
                          onClick={() => onSelectBill(item.id)}
                          className="px-2.5 py-1.5 bg-stone-900 text-[10.5px] font-semibold text-stone-100 rounded-md hover:bg-amber-500 hover:text-stone-950 transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <span>Summary</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Federal Committees Tab (Right 1 column) */}
          <div className="space-y-6">
            <div className="bg-[#F9F8F6] border-2 border-stone-900 p-5 shadow-sm space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-display font-black text-stone-900 flex items-center gap-1.5">
                  <Layers className="h-4.5 w-4.5 text-amber-600" />
                  Key Standing Committees
                </h3>
                <p className="text-[11px] text-stone-500">Examine federal panels where bills are edited before being introduced to the chambers.</p>
              </div>

              <div className="space-y-3.5">
                {STANDING_COMMITTEES.map((com) => {
                  const isSelected = selectedCommittee === com.name;
                  return (
                    <div 
                      key={com.id}
                      onClick={() => setSelectedCommittee(isSelected ? null : com.name)}
                      className={`p-3.5 rounded-none border transition-all cursor-pointer text-left space-y-2 ${
                        isSelected 
                          ? "bg-stone-900 text-stone-100 border-stone-900 shadow-md" 
                          : "bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[8.5px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          isSelected ? "bg-amber-500/20 text-amber-400" : "bg-stone-200 text-stone-600"
                        }`}>
                          {com.chamber} Jurisdiction
                        </span>
                        <ChevronRight className={`h-3.5 w-3.5 text-stone-400 transition-transform ${isSelected ? "rotate-90 text-amber-400" : ""}`} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold leading-snug">{com.name}</h4>
                        <p className={`text-[10.5px] leading-relaxed mt-1 ${isSelected ? "text-stone-350" : "text-stone-500"}`}>
                          {com.desc}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {com.tags.map((tag, t_idx) => (
                          <span 
                            key={t_idx} 
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                              isSelected ? "bg-stone-800 text-stone-300" : "bg-[#F9F8F6] text-stone-500 border border-stone-200"
                            }`}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Display Committee Members Sub-Panel if selected */}
            {selectedCommittee && (
              <div className="bg-stone-900 text-stone-100 rounded-none border border-stone-800 p-5 space-y-3.5 shadow-md animate-fade-in">
                <div className="border-b border-stone-800 pb-2.5">
                  <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">Committee Assignment</h4>
                  <p className="text-xs font-bold text-stone-200 line-clamp-1 mt-0.5">{selectedCommittee}</p>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {committeeMembers.length === 0 ? (
                    <div className="text-[10px] text-stone-400 italic text-center py-4">
                      No members of this committee are represented in your local cached list.
                    </div>
                  ) : (
                    committeeMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between text-xs p-1.5 bg-stone-950/60 rounded border border-stone-850">
                        <div>
                          <span className="font-bold text-stone-200 block">{member.name}</span>
                          <span className="text-[9px] text-stone-400 font-mono uppercase">{member.party}-{member.state} | {member.chamber}</span>
                        </div>
                        <button
                          onClick={() => toggleFollowLegislator(member.id)}
                          className={`text-[8.5px] font-mono px-2 py-0.5 rounded font-bold ${
                            followedLegislators.includes(member.id)
                              ? "bg-amber-500 text-stone-950"
                              : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                          }`}
                        >
                          {followedLegislators.includes(member.id) ? "Drafted" : "Draft"}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 3: POLITICIANS DIRECTORY (HOUSE & SENATE)
         ---------------------------------------------------- */}
      {activeSubTab === "directory" && (
        <div className="space-y-6">
          {/* Filters Bar card */}
          <div className="bg-[#F9F8F6] border-2 border-stone-900 p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-3">
              <div className="space-y-1">
                <h3 className="text-sm font-display font-black text-stone-900 flex items-center gap-1.5">
                  <Users className="h-4.5 w-4.5 text-amber-600" />
                  Roster Filter System
                </h3>
                <p className="text-[11px] text-stone-500">Query and research active, current members of both chambers.</p>
              </div>
              <div className="text-xs font-mono font-bold bg-stone-100 text-stone-600 px-3 py-1 rounded">
                Showing {filteredLegislators.length} of {legislators.length} members
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {/* Search input */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search politician name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-250 rounded-none py-2 pl-9 pr-4 text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-[#F9F8F6] transition-all"
                />
              </div>

              {/* Chamber selector */}
              <div>
                <select
                  value={chamberFilter}
                  onChange={(e) => setChamberFilter(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-250 rounded-none py-2 px-3 text-xs font-semibold focus:outline-none focus:border-amber-500 transition-all"
                >
                  <option value="ALL">All Chambers</option>
                  <option value="House">House</option>
                  <option value="Senate">Senate</option>
                </select>
              </div>

              {/* Party selector */}
              <div>
                <select
                  value={partyFilter}
                  onChange={(e) => setPartyFilter(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-250 rounded-none py-2 px-3 text-xs font-semibold focus:outline-none focus:border-amber-500 transition-all"
                >
                  <option value="ALL">All Parties</option>
                  <option value="D">Democrats (D)</option>
                  <option value="R">Republicans (R)</option>
                </select>
              </div>

              {/* State selector */}
              <div>
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-250 rounded-none py-2 px-3 text-xs font-semibold focus:outline-none focus:border-amber-500 transition-all"
                >
                  <option value="ALL">All States</option>
                  {Object.entries(STATE_NAMES).map(([code, name]) => (
                    <option key={code} value={code}>{code} - {name}</option>
                  ))}
                </select>
              </div>

              {/* Sort selector */}
              <div>
                <select
                  value={sortFilter}
                  onChange={(e) => setSortFilter(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-250 rounded-none py-2 px-3 text-xs font-semibold text-amber-700 focus:outline-none focus:border-amber-500 transition-all"
                >
                  <option value="NAME">Sort: Name (A-Z)</option>
                  <option value="WORST_GRADE">Sort: Worst Index Grade First</option>
                  <option value="BEST_GRADE">Sort: Best Index Grade First</option>
                  <option value="ATTENDANCE">Sort: Highest Attendance</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {loadingLegs ? (
            <div className="py-24 text-center text-stone-500 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="h-10 w-10 text-amber-500 animate-spin" />
              <span className="text-sm font-semibold">Generating live scoring models...</span>
            </div>
          ) : paginatedLegislators.length === 0 ? (
            <div className="bg-[#F9F8F6] border-2 border-stone-900 py-16 text-center text-stone-500 space-y-2 shadow-xs">
              <AlertCircle className="h-10 w-10 text-stone-400 mx-auto" />
              <p className="text-sm font-bold">No matching politicians found.</p>
              <p className="text-xs text-stone-400">Clear your filters or search parameters and try again.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedLegislators.map((leg) => {
                  const isFollowed = followedLegislators.includes(leg.id);
                  const isExpanded = expandedLegVotes[leg.id] || false;
                  return (
                    <div 
                      key={leg.id}
                      className="bg-[#F9F8F6] rounded-none border border-stone-250 hover:border-stone-400 p-5 flex flex-col justify-between transition-all shadow-sm group hover:-transtone-y-0.5"
                    >
                      <div className="space-y-3.5">
                        <div className="flex items-start gap-3">
                          {leg.imageUrl ? (
                            <img
                              src={leg.imageUrl}
                              alt={leg.name}
                              referrerPolicy="no-referrer"
                              className="h-12 w-12 rounded-full object-cover border border-stone-200 bg-stone-50"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center font-bold text-sm border border-stone-200">
                              {leg.name.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold text-stone-900 group-hover:text-amber-600 transition-colors truncate">{leg.name}</h4>
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0 ${
                                leg.party === "D" 
                                  ? "bg-blue-50 text-blue-700 border border-blue-100" 
                                  : leg.party === "R" 
                                    ? "bg-red-50 text-red-700 border border-red-100" 
                                    : "bg-stone-100 text-stone-705 border border-stone-200"
                              }`}>
                                {leg.party}-{leg.state}
                              </span>
                            </div>
                            <p className="text-[10.5px] font-semibold text-stone-500 mt-0.5">
                              {leg.chamber} • {getFullStateName(leg.state)}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                              <p className="text-[10px] font-medium text-stone-450">
                                Attendance Rate: <span className="text-stone-700 font-bold">{leg.attendanceRate}%</span>
                              </p>
                              {leg.libertyProsperityIndex && (
                                <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-stone-600">
                                  • Liberty Grade: 
                                  <span className="text-[9.5px] font-sans font-black text-amber-700 bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 rounded leading-none">
                                    {leg.libertyProsperityIndex.grade}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Committees Roster for this politician */}
                        {leg.committees && leg.committees.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[8px] font-mono font-bold text-stone-400 uppercase tracking-widest block">Standing Committees:</span>
                            <div className="flex flex-wrap gap-1">
                              {leg.committees.map((com, idx) => (
                                <span key={idx} className="bg-stone-50 border border-stone-200 text-[9px] text-stone-600 px-2 py-0.5 rounded leading-tight">
                                  {com.replace("Committee on ", "").replace("Senate ", "").replace("House ", "")}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Voting history drawer */}
                        <div className="pt-2 border-t border-stone-100">
                          <button
                            onClick={() => toggleExpandVotes(leg.id)}
                            className="w-full flex items-center justify-between text-[10px] font-bold text-stone-500 hover:text-stone-950 transition-colors py-1 focus:outline-none"
                          >
                            <span>{isExpanded ? "Hide Voting History" : "Reveal Voting History"}</span>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 space-y-2.5 bg-stone-50 p-2.5 rounded-none border border-stone-200 animate-fade-in text-[10.5px] leading-relaxed text-stone-600">
                              {leg.votingHistory && leg.votingHistory.length > 0 ? (
                                leg.votingHistory.map((v, vidx) => (
                                  <div key={vidx} className="border-b border-stone-200/60 last:border-0 pb-1.5 last:pb-0 pt-0.5">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-mono font-bold text-amber-600 bg-[#F9F8F6] px-1.5 py-0.2 rounded border border-stone-200">{v.billId}</span>
                                      <span className={`font-mono font-bold px-1.5 py-0.2 rounded ${
                                        v.vote === "Yea" 
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-150" 
                                          : "bg-rose-50 text-rose-700 border border-rose-150"
                                      }`}>
                                        {v.vote}
                                      </span>
                                    </div>
                                    <div className="font-bold text-stone-800 line-clamp-1 mt-1">{v.billTitle}</div>
                                    <p className="text-stone-500 text-[10px] italic mt-0.5">{v.impact}</p>
                                    <div className="text-[8.5px] font-mono text-stone-400 mt-1">Vote Date: {v.date}</div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-stone-400 py-1 text-center">No votes compiled.</div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Ask AI About Politician Button */}
                        {onNavigateToTab && (
                          <button
                            onClick={() => onNavigateToTab("chat")}
                            className="mt-2.5 w-full flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold py-1.5 px-2 transition-colors cursor-pointer"
                          >
                            <HelpCircle className="h-3.5 w-3.5 text-blue-600" />
                            <span>Ask AI About {leg.name.split(' ').slice(-1)[0]}'s Grade & Record</span>
                          </button>
                        )}
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-center justify-between text-[10.5px]">
                        <span className="text-stone-400 font-mono text-[9px]">Bioguide: {leg.id}</span>
                        <button
                          onClick={() => toggleFollowLegislator(leg.id)}
                          className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer text-xs ${
                            isFollowed
                              ? "bg-amber-500 text-stone-950 border border-amber-500 hover:bg-red-500 hover:text-white hover:border-red-500"
                              : "bg-stone-100 border border-stone-200 text-stone-700 hover:bg-stone-200"
                          }`}
                        >
                          {isFollowed ? "In Squad" : "Draft Politician"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4 border-t border-stone-200">
                  <button
                    onClick={() => setDirectoryPage(p => Math.max(1, p - 1))}
                    disabled={directoryPage === 1}
                    className="px-4 py-2 bg-[#F9F8F6] border border-stone-200 rounded-none text-xs font-semibold hover:bg-stone-50 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-mono font-bold text-stone-600">
                    Page {directoryPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setDirectoryPage(p => Math.min(totalPages, p + 1))}
                    disabled={directoryPage === totalPages}
                    className="px-4 py-2 bg-[#F9F8F6] border border-stone-200 rounded-none text-xs font-semibold hover:bg-stone-50 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
