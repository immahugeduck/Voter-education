import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BarChart3,
  CalendarDays,
  Bell,
  User,
  MapPin,
  Check,
  ArrowUpRight,
  Loader2,
  HelpCircle,
  Send,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Clock,
  Layers,
  X,
  MessageSquare,
  Bot
} from "lucide-react";
import { RollCallVote, LegislativeSession, UpcomingVoteAlert, LegislatorScorecard, ChatMessage } from "../types";

interface RollCallVotesViewProps {
  votes: RollCallVote[];
  onRefreshVotes: () => void;
  isLoadingVotes: boolean;
  sessions: LegislativeSession[];
  onRefreshSessions: () => void;
  isLoadingSessions: boolean;
  defaultSubTab?: "upcoming-debates" | "upcoming-votes" | "completed-votes";
}

export default function RollCallVotesView({
  votes,
  onRefreshVotes,
  isLoadingVotes,
  sessions,
  onRefreshSessions,
  isLoadingSessions,
  defaultSubTab = "upcoming-votes"
}: RollCallVotesViewProps) {
  // Navigation tabs state
  const [activeSubTab, setActiveSubTab] = useState<"upcoming-debates" | "upcoming-votes" | "completed-votes">(defaultSubTab);

  // Sync sub-tab if route changes
  useEffect(() => {
    if (defaultSubTab) {
      setActiveSubTab(defaultSubTab);
    }
  }, [defaultSubTab]);

  // Upcoming scheduled alerts (votes) and legislators states
  const [alerts, setAlerts] = useState<UpcomingVoteAlert[]>([]);
  const [legislators, setLegislators] = useState<LegislatorScorecard[]>([]);
  const [selectedLegId, setSelectedLegId] = useState<string>("leg-1"); // Defaults to Warren
  const [isLoadingAlerts, setIsLoadingAlerts] = useState<boolean>(true);
  const [userNotifications, setUserNotifications] = useState<Record<string, boolean>>({});

  // AI chat drawer states
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatContext, setChatContext] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch upcoming scheduled votes (alerts) and legislators
  useEffect(() => {
    async function fetchAlertsAndLegs() {
      try {
        setIsLoadingAlerts(true);
        // Load Alerts
        const resAlerts = await fetch("/api/legislation/alerts");
        const alertsJson = await resAlerts.json();
        setAlerts(alertsJson.data || []);

        // Load Legislators
        const resLegs = await fetch("/api/legislation/legislators");
        const legsJson = await resLegs.json();
        setLegislators(legsJson.data || []);

        if (legsJson.data && legsJson.data.length > 0) {
          const hasDefault = legsJson.data.some((l: any) => l.id === "leg-1");
          if (!hasDefault) {
            setSelectedLegId(legsJson.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load alerts & legislators in unified view:", err);
      } finally {
        setIsLoadingAlerts(false);
      }
    }
    fetchAlertsAndLegs();
  }, []);

  // Scroll chat to bottom when messages list updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isAiTyping]);

  const selectedLeg = legislators.find((l) => l.id === selectedLegId);

  const toggleNotification = (id: string) => {
    setUserNotifications((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Open Chat Drawer seeded with specific bill/debate context
  const handleOpenAiChat = (item: any, type: "session" | "alert" | "vote") => {
    let title = "";
    let id = "";
    let summary = "";
    let category = "General Policy";
    let status = "";

    if (type === "session") {
      title = item.topic;
      id = item.chamber + " Session";
      summary = item.details;
      status = item.status;
    } else if (type === "alert") {
      title = item.billTitle;
      id = item.billId;
      summary = item.plainSummary;
      status = "Scheduled Vote";
    } else if (type === "vote") {
      title = item.billTitle;
      id = item.billId;
      summary = `Roll call completed. Result: ${item.result}. Party split: ${item.partyBreakdown}`;
      status = item.result;
    }

    const context = { id, title, summary, category, status, raw: item, type };
    setChatContext(context);
    setIsChatOpen(true);

    // Seed initial assistant message
    setChatMessages([
      {
        id: "initial",
        role: "assistant",
        content: `Hello! I am **CapitolExpert AI**, analyzing details for: **${id} - ${title}**.\n\nI can provide objective, non-partisan context, policy arguments (pros and cons), or legislative procedures surrounding this. Ask me anything!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  };

  // Send message to AI endpoint
  const handleSendChatMessage = async (msgText: string) => {
    if (!msgText.trim() || isAiTyping) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: msgText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsAiTyping(true);

    try {
      const resp = await fetch("/api/legislation/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msgText,
          billContext: chatContext
            ? {
                id: chatContext.id,
                title: chatContext.title,
                status: chatContext.status,
                synopsis: chatContext.summary,
                category: chatContext.category
              }
            : undefined
        })
      });

      if (!resp.ok) {
        throw new Error("Chat endpoint returned error status");
      }

      const data = await resp.json();
      const aiMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "assistant",
          content: "I ran into a server communication issue. Please check your API Key configuration in the diagnostics panel.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Get sample questions based on active item context
  const getSampleInquiries = () => {
    if (!chatContext) return [];
    const isAlertOrVote = chatContext.id.includes("H.R.") || chatContext.id.includes("S.");
    
    if (chatContext.id.includes("7005")) {
      return [
        "What are the major pros and cons of the AI Frontier re-authorizations?",
        "Why are moderate politicians supporting or opposing the compute limits?",
        "Does H.R. 7005 contain exemptions for open-source developers?"
      ];
    }
    if (chatContext.id.includes("2058") || chatContext.id.toLowerCase().includes("farm")) {
      return [
        "Explain S. 2058 Farm Bill extension and SNAP funding details.",
        "Why do some budget hawks oppose the crop insurance directive?",
        "When does S. 2058 expire?"
      ];
    }
    if (chatContext.id.includes("3853") || chatContext.id.toLowerCase().includes("medical")) {
      return [
        "How does S. 3853 cap drug prices at $35?",
        "What are the pharmaceutical arguments against price ceilings?",
        "Will S. 3853 apply to commercial health insurances?"
      ];
    }
    if (isAlertOrVote) {
      return [
        `What are the primary policy goals of ${chatContext.id}?`,
        `What are the Republican and Democratic arguments regarding ${chatContext.id}?`,
        `Who sponsored ${chatContext.id} and what is its status?`
      ];
    }
    return [
      "Can you summarize this scheduled committee topic for me in plain terms?",
      "Who are the key lawmakers expected to speak on this topic?",
      "What is the historical legislative background of this debate?"
    ];
  };

  const handleRefreshActiveTab = () => {
    if (activeSubTab === "completed-votes") {
      onRefreshVotes();
    } else if (activeSubTab === "upcoming-debates") {
      onRefreshSessions();
    } else {
      // Refresh alerts
      const fetchAlertsOnly = async () => {
        try {
          setIsLoadingAlerts(true);
          const res = await fetch("/api/legislation/alerts");
          const json = await res.json();
          setAlerts(json.data || []);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoadingAlerts(false);
        }
      };
      fetchAlertsOnly();
    }
  };

  const isTabLoading = 
    activeSubTab === "completed-votes" ? isLoadingVotes :
    activeSubTab === "upcoming-debates" ? isLoadingSessions :
    isLoadingAlerts;

  return (
    <div className="space-y-6 relative">
      {/* 1. Header Hero Panel */}
      <div className="bg-stone-900 text-white rounded-none border border-stone-800 p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <CalendarDays className="h-32 w-32" />
        </div>
        <div className="relative max-w-2xl space-y-2">
          <h2 className="text-xl font-display font-black text-stone-100 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-amber-500" />
            Congressional Floor Activity, Debates & Votes
          </h2>
          <p className="text-stone-400 text-xs leading-relaxed">
            A unified, direct control room containing past bipartisan roll calls, live upcoming debates, and predictive models. Highlight any scheduled action and click <span className="text-amber-400 font-bold">Ask AI</span> to query our search-grounded assistant on policy pros and cons.
          </p>
        </div>
      </div>

      {/* 2. Primary Tabs Selector & Control Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-3">
        <div className="flex flex-wrap bg-stone-100 p-1.5 rounded-none border border-stone-200/60 shadow-xs gap-1.5 self-start">
          <button
            onClick={() => setActiveSubTab("upcoming-votes")}
            className={`px-4 py-2 text-xs font-bold rounded-none transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "upcoming-votes"
                ? "bg-stone-900 text-amber-500 shadow-sm"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
            }`}
          >
            <Bell className="h-3.5 w-3.5" />
            Upcoming Votes & Predictor
          </button>

          <button
            onClick={() => setActiveSubTab("upcoming-debates")}
            className={`px-4 py-2 text-xs font-bold rounded-none transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "upcoming-debates"
                ? "bg-stone-900 text-amber-500 shadow-sm"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Upcoming Debates & Hearings
          </button>

          <button
            onClick={() => setActiveSubTab("completed-votes")}
            className={`px-4 py-2 text-xs font-bold rounded-none transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "completed-votes"
                ? "bg-stone-900 text-amber-500 shadow-sm"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Completed Roll Calls
          </button>
        </div>

        <button
          onClick={handleRefreshActiveTab}
          disabled={isTabLoading}
          className="px-3.5 py-1.5 bg-[#F9F8F6] border border-stone-200 hover:border-stone-350 disabled:opacity-50 text-stone-700 rounded-none text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <RefreshCw className={`h-3 w-3 text-stone-500 ${isTabLoading ? "animate-spin" : ""}`} />
          {isTabLoading ? "Syncing..." : "Refresh Feed"}
        </button>
      </div>

      {/* 3. Subview Panel Content Rendering */}
      {isTabLoading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-[#F9F8F6] rounded-none border border-stone-200 shadow-sm">
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
          <span className="text-xs font-mono text-stone-500">Retrieving real-time congressional floor schedules...</span>
        </div>
      ) : (
        <div className="animate-fade-in" id="unified-votes-container">
          {/* SUBVIEW A: UPCOMING VOTES & PREDICTOR */}
          {activeSubTab === "upcoming-votes" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Scheduled Votes Docket Stream */}
              <div className="lg:col-span-8 space-y-4">
                <h3 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest px-1">
                  Upcoming Key Scheduled Floor Votes
                </h3>

                {alerts.length === 0 ? (
                  <div className="p-12 text-center bg-[#F9F8F6] border border-stone-200 rounded-none text-stone-500 italic text-xs">
                    No active scheduled upcoming votes on the docket. Check back later!
                  </div>
                ) : (
                  alerts.map((alert) => {
                    const predictionObj = alert.predictedVotes?.find(v => v.legislatorId === selectedLegId);
                    const isNotified = userNotifications[alert.id] || false;

                    return (
                      <div 
                        key={alert.id}
                        id={`alert-card-${alert.billId.replace(/\s+/g, '-').toLowerCase()}`}
                        className="bg-[#F9F8F6] rounded-none border border-stone-200 hover:border-stone-300 shadow-sm overflow-hidden transition"
                      >
                        {/* Top Scheduled State Bar */}
                        <div className="px-5 py-3.5 bg-stone-50 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-stone-200 text-stone-800 rounded">
                              {alert.billId}
                            </span>
                            <span className="text-[11px] font-mono text-stone-550 font-bold uppercase tracking-wider text-stone-500">
                              Scheduled: {alert.scheduledTime}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {alert.importance === "Critical" ? (
                              <span className="px-2 py-0.5 text-[9px] font-mono font-extrabold bg-red-50 text-red-700 border border-red-100 rounded">
                                CRITICAL VOTE
                              </span>
                            ) : alert.importance === "High" ? (
                              <span className="px-2 py-0.5 text-[9px] font-mono font-extrabold bg-amber-50 text-amber-700 border border-amber-100 rounded">
                                HIGH IMPORTANT
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[9px] font-mono font-extrabold bg-stone-100 text-stone-700 border border-stone-200 rounded">
                                NORMAL DOCKET
                              </span>
                            )}

                            <button
                              onClick={() => toggleNotification(alert.id)}
                              className={`text-xs px-3 py-1 rounded-full font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                isNotified 
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm" 
                                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                              }`}
                            >
                              <Bell className="h-3 w-3" />
                              <span>{isNotified ? "Alert Armed" : "Notify Me"}</span>
                            </button>
                          </div>
                        </div>

                        {/* Card Main Body */}
                        <div className="p-5 space-y-4">
                          <div>
                            <h4 className="font-sans font-extrabold text-sm text-stone-900 leading-snug">
                              {alert.billTitle}
                            </h4>
                            <p className="text-xs text-stone-600 leading-relaxed mt-2 p-3 bg-stone-50 rounded-none border border-stone-100 italic">
                              &quot;{alert.plainSummary}&quot;
                            </p>
                          </div>

                          {/* Prediction Panel for Representative */}
                          <div className="p-4 bg-stone-900 text-white rounded-none space-y-3 border border-stone-800">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-800 pb-2.5 gap-2">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-400 animate-pulse" />
                                <span className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wide">
                                  {selectedLeg?.name || "Representative"}&apos;s Forecast Alignment
                                </span>
                              </div>
                              {predictionObj && (
                                <span className={`text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded border self-start sm:self-center ${
                                  predictionObj.prediction.includes("Yea") 
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                                    : "bg-red-500/10 text-red-400 border-red-500/30"
                                }`}>
                                  Predicted: {predictionObj.prediction} ({predictionObj.confidence}% Confidence)
                                </span>
                              )}
                            </div>

                            {predictionObj ? (
                              <div className="space-y-1.5">
                                <p className="text-xs text-stone-300 leading-relaxed font-semibold">
                                  {predictionObj.reasoning}
                                </p>
                                <div className="text-[10px] text-stone-500 font-mono tracking-wide uppercase">
                                  Grounded prediction models processed using historical sponsorship files and speech registries
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-stone-400 leading-relaxed">
                                No forecast prediction available for this legislator on this bill. Choose another representative on the right panel to test prediction models.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Bottom action bar */}
                        <div className="p-4 bg-stone-50 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <span className="text-[10px] font-mono text-stone-400 uppercase font-semibold">
                            Official Docket Source: Congress.gov
                          </span>
                          
                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            <button
                              onClick={() => handleOpenAiChat(alert, "alert")}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold rounded-none shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Bot className="h-3.5 w-3.5" />
                              <span>Ask AI Assistant</span>
                            </button>

                            <a
                              href={alert.billUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            >
                              <span>Draft details</span>
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selector Sidebar (Right Column) */}
              <div className="lg:col-span-4 bg-[#F9F8F6] p-5 rounded-none border border-stone-200 shadow-sm space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-bold tracking-widest text-stone-400 uppercase flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-amber-500" /> Representative Focus
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Select a representative below to dynamically cross-reference their predicted voting alignments on all scheduled dockets:
                  </p>
                </div>

                {/* Representatives Selector List */}
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {legislators.map((leg) => {
                    const isSelected = leg.id === selectedLegId;
                    return (
                      <button
                        key={leg.id}
                        onClick={() => setSelectedLegId(leg.id)}
                        className={`w-full text-left p-3 rounded-none border flex items-center justify-between transition-all cursor-pointer ${
                          isSelected 
                            ? "bg-stone-900 text-white border-stone-900 shadow-md font-semibold" 
                            : "bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs truncate">{leg.name}</div>
                          <div className={`text-[9px] font-mono ${isSelected ? "text-stone-400" : "text-stone-500"} mt-0.5`}>
                            {leg.party}-{leg.state} • Attendance: {leg.attendanceRate}%
                          </div>
                        </div>
                        {isSelected && (
                          <span className="h-5 w-5 bg-amber-500 text-stone-950 rounded-full flex items-center justify-center">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Profile Focus details */}
                {selectedLeg && (
                  <div className="p-4 bg-stone-50 border border-stone-150 rounded-none space-y-3">
                    <h4 className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">
                      Active Focus Profile
                    </h4>
                    <div className="flex items-center gap-3">
                      {selectedLeg.imageUrl && (
                        <img 
                          src={selectedLeg.imageUrl} 
                          alt={selectedLeg.name} 
                          referrerPolicy="no-referrer"
                          className="h-10 w-10 rounded-full object-cover border border-stone-200 bg-[#F9F8F6]"
                        />
                      )}
                      <div>
                        <span className="text-xs font-bold text-stone-950 block">{selectedLeg.name}</span>
                        <span className="text-[10px] text-stone-500 font-mono block">Chamber: {selectedLeg.chamber}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUBVIEW B: UPCOMING DEBATES & HEARINGS */}
          {activeSubTab === "upcoming-debates" && (
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest px-1">
                Upcoming Congressional Debate & Committee Hearings Calendar
              </h3>

              {sessions.length === 0 ? (
                <div className="p-12 text-center bg-[#F9F8F6] border border-stone-200 rounded-none text-stone-500 italic text-xs">
                  No active debates or hearings on the upcoming calendar.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {sessions.map((session, idx) => {
                    const isHouse = session.chamber.toLowerCase() === "house";
                    const isSenate = session.chamber.toLowerCase() === "senate";
                    const isHigh = session.importance.toLowerCase() === "high";

                    return (
                      <div
                        key={idx}
                        className="bg-stone-900 border border-stone-800 hover:border-stone-750 p-5 rounded-none transition-all shadow-sm"
                        id={`session-card-${idx}`}
                      >
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-3 flex-1">
                            {/* Category Pill Line */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                                  isHouse
                                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                    : isSenate
                                    ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                    : "bg-teal-500/10 text-teal-400 border-teal-500/20"
                                }`}
                              >
                                {session.chamber.toUpperCase()}
                              </span>

                              <span className="text-[10px] font-mono bg-stone-850 text-stone-350 px-2.5 py-0.5 rounded border border-stone-800 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {session.time}
                              </span>

                              <span className="text-[10px] font-mono bg-stone-850 text-stone-350 px-2.5 py-0.5 rounded border border-stone-800">
                                {session.status}
                              </span>

                              {isHigh && (
                                <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/15 flex items-center gap-1">
                                  <Layers className="h-3 w-3" /> HIGH IMPORTANCE
                                </span>
                              )}
                            </div>

                            {/* Topic Heading */}
                            <div>
                              <h3 className="text-base font-display font-black text-stone-100">
                                {session.topic}
                              </h3>
                              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                                {session.details}
                              </p>
                            </div>
                          </div>

                          {/* Right action block */}
                          <div className="flex items-center md:items-end justify-between md:flex-col gap-2.5 border-t md:border-t-0 border-stone-850 pt-3 md:pt-0">
                            <div className="text-left md:text-right">
                              <div className="text-[10px] font-mono text-stone-500 uppercase">Debated date</div>
                              <div className="text-sm font-bold text-stone-300 mt-0.5">{session.date}</div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenAiChat(session, "session")}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold rounded-none shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Bot className="h-3.5 w-3.5" />
                                <span>Ask AI</span>
                              </button>

                              <button
                                onClick={() => alert(`Alert requested for: ${session.topic}. CapitolTrack will ping you when live feeds start.`)}
                                className="p-1.5 px-3 bg-stone-800/80 border border-stone-750 hover:bg-stone-700/80 hover:text-amber-400 text-stone-450 text-xs font-semibold rounded-none transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Bell className="h-3.5 w-3.5" />
                                <span>Watch live notify</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SUBVIEW C: COMPLETED ROLL CALL VOTES */}
          {activeSubTab === "completed-votes" && (
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest px-1">
                Completed Roll Call Votes & Tallies
              </h3>

              {votes.length === 0 ? (
                <div className="p-12 text-center bg-[#F9F8F6] border border-stone-200 rounded-none text-stone-500 italic text-xs">
                  No completed roll call votes logged recently.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {votes.map((vote, idx) => {
                    const totalVotes = vote.yeas + vote.nays;
                    const yeaPct = totalVotes > 0 ? Math.round((vote.yeas / totalVotes) * 100) : 0;
                    const nayPct = totalVotes > 0 ? Math.round((vote.nays / totalVotes) * 100) : 0;
                    const isPassed = vote.result.toLowerCase().includes("passed") || vote.result.toLowerCase().includes("agreed");

                    return (
                      <div
                        key={idx}
                        id={`vote-card-${vote.billId.replace(/\s+/g, '-').toLowerCase()}`}
                        className="bg-[#F9F8F6] rounded-none border border-stone-200 shadow-sm overflow-hidden flex flex-col justify-between"
                      >
                        {/* Top Tally State Bar */}
                        <div className="p-4 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-stone-200 text-stone-800 rounded">
                              {vote.billId}
                            </span>
                            <span className="text-[11px] font-mono text-stone-500">
                              Roll Call {vote.rollCallNum}
                            </span>
                          </div>
                          <div>
                            {isPassed ? (
                              <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/60">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> PASSED
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-xs font-bold text-red-600 bg-red-50/70 px-2 py-0.5 rounded border border-red-100">
                                <XCircle className="h-3 w-3 mr-1" /> REJECTED
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card details body */}
                        <div className="p-5 space-y-4 flex-1">
                          <div>
                            <h3 className="font-display font-black text-sm text-stone-900 leading-snug">
                              {vote.billTitle}
                            </h3>
                            <div className="text-[11px] text-stone-400 font-mono mt-1 uppercase">
                              Chamber: <span className="font-semibold text-stone-700">{vote.votedChamber}</span> | Voted On: <span className="font-semibold text-stone-705">{vote.date}</span>
                            </div>
                          </div>

                          {/* Progress graph indicator */}
                          <div className="space-y-1.5">
                            <div className="text-[10px] font-mono text-stone-400 font-semibold flex justify-between">
                              <span>YEA: {vote.yeas} ({yeaPct}%)</span>
                              <span>NAY: {vote.nays} ({nayPct}%)</span>
                            </div>
                            <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden flex">
                              <div
                                className="bg-emerald-500 h-full transition-all duration-500"
                                style={{ width: `${yeaPct}%` }}
                              ></div>
                              <div
                                className="bg-red-500 h-full transition-all duration-500"
                                style={{ width: `${nayPct}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Party Breakdown Details Box */}
                          <div className="p-3 bg-stone-50 rounded-none border border-stone-100 flex items-start space-x-2">
                            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wide">Party Alignment</h4>
                              <p className="text-xs text-stone-750 leading-relaxed mt-0.5 font-medium">
                                {vote.partyBreakdown}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* High friction warn footer */}
                        <div className="p-4.5 bg-stone-50 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3.5">
                          <div>
                            {vote.isHighlyDisputed && (
                              <div className="text-[10px] text-amber-700 flex items-center space-x-1.5 font-mono uppercase tracking-wider font-extrabold">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                                <span>High Polarized split</span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleOpenAiChat(vote, "vote")}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold rounded-none shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer self-end"
                          >
                            <Bot className="h-3.5 w-3.5" />
                            <span>Ask AI Details</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Sliding AI Policy Desk Chat Drawer (Slide in from Right Panel) */}
      <AnimatePresence>
        {isChatOpen && chatContext && (
          <>
            {/* Darkening Back Drop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs z-40 cursor-pointer"
            />

            {/* Chat Drawer Sidebar */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-stone-950 text-stone-100 shadow-2xl z-50 flex flex-col border-l border-stone-800"
            >
              {/* Drawer Top Header Banner */}
              <div className="p-4.5 border-b border-stone-800 flex items-center justify-between bg-stone-900/90">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500/10 text-amber-500 rounded-none border border-amber-500/20">
                    <Sparkles className="h-4.5 w-4.5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-sm text-stone-100 flex items-center gap-1.5">
                      CapitolExpert AI Assistant
                    </h3>
                    <p className="text-[10px] font-mono text-stone-400 uppercase tracking-wide">
                      Grounded Congressional Intelligence
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1.5 hover:bg-stone-800 rounded-none text-stone-400 hover:text-white transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Seed Context metadata bar */}
              <div className="p-4 bg-stone-900/40 border-b border-stone-800 text-xs space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-stone-800 text-stone-300 font-mono font-bold text-[9.5px] rounded border border-stone-700 uppercase">
                    {chatContext.id}
                  </span>
                  <span className="text-[10px] font-bold text-amber-500">{chatContext.status}</span>
                </div>
                <h4 className="font-display font-black text-stone-200 line-clamp-1">{chatContext.title}</h4>
                <p className="text-[10px] text-stone-400 line-clamp-2 leading-relaxed italic">&ldquo;{chatContext.summary}&rdquo;</p>
              </div>

              {/* Chat Message Lists Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-280px)] scrollbar-thin">
                {chatMessages.map((m) => {
                  const isAi = m.role === "assistant";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${
                        isAi ? "items-start mr-auto" : "items-end ml-auto"
                      } max-w-[85%] space-y-1 animate-fade-in`}
                    >
                      <div className="flex items-center gap-1">
                        {isAi && <Bot className="h-3 w-3 text-amber-500" />}
                        <span className="text-[9px] font-mono text-stone-500 font-bold uppercase tracking-wider">
                          {isAi ? "CapitolExpert AI" : "Citizen inquirer"}
                        </span>
                      </div>
                      <div
                        className={`p-3.5 rounded-none text-xs leading-relaxed whitespace-pre-wrap ${
                          isAi
                            ? "bg-stone-900 text-stone-200 border border-stone-800"
                            : "bg-blue-600 text-white font-medium"
                        }`}
                      >
                        {m.content}
                      </div>
                      <span className="text-[8px] font-mono text-stone-500 px-1">{m.timestamp}</span>
                    </div>
                  );
                })}

                {isAiTyping && (
                  <div className="flex items-center space-x-2 text-stone-455 text-xs pl-1 animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                    <span className="font-mono text-stone-400">Searching recent committee schedules and transcripts...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Precompiled Interactive Prompt Tags */}
              <div className="p-4 border-t border-stone-850/80 bg-stone-900/10 space-y-1.5 flex-shrink-0">
                <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest block font-bold">
                  Recommended Inquiries:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {getSampleInquiries().map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendChatMessage(prompt)}
                      disabled={isAiTyping}
                      className="text-[10px] text-left p-2 rounded-none bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-amber-500/30 text-stone-300 transition-colors cursor-pointer leading-tight max-w-full"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Message box form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessage(chatInput);
                }}
                className="p-4 border-t border-stone-800 bg-stone-900 flex items-center gap-2.5 flex-shrink-0"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Ask AI about ${chatContext.id || "this bill"}...`}
                  disabled={isAiTyping}
                  className="flex-1 bg-stone-950 border border-stone-800 focus:border-amber-500 focus:outline-none rounded-none px-4 py-2.5 text-xs text-stone-200 transition-all"
                />
                <button
                  type="submit"
                  disabled={isAiTyping || !chatInput.trim()}
                  className="p-3 bg-amber-500 hover:bg-amber-600 disabled:bg-stone-800 disabled:text-stone-600 text-stone-950 rounded-full transition shadow-sm cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
