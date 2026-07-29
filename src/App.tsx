import React, { useState, useEffect } from "react";
import Navigation from "./components/Navigation";
import Dashboard from "./components/Dashboard";
import PlainLanguageDirectory from "./components/PlainLanguageDirectory";
import LegislativeSessions from "./components/LegislativeSessions";
import RollCallVotesView from "./components/RollCallVotesView";
import StandaloneChat from "./components/StandaloneChat";
import BillDetailModal from "./components/BillDetailModal";
import StateBriefing from "./components/StateBriefing";
import UpcomingVoteAlerts from "./components/UpcomingVoteAlerts";
import CitizensConsensus from "./components/CitizensConsensus";
import VoterInformation from "./components/VoterInformation";
import ApiDiagnosticsModal from "./components/ApiDiagnosticsModal";
import MySquadDashboard from "./components/MySquadDashboard";
import { Accomplishment, LegislativeSession, RollCallVote } from "./types";
import { Landmark, Calendar, Settings, ArrowUpRight } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  // Core Legislative Data States
  const [accomplishments, setAccomplishments] = useState<Accomplishment[]>([]);
  const [sessions, setSessions] = useState<LegislativeSession[]>([]);
  const [votes, setVotes] = useState<RollCallVote[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [followedLegislators, setFollowedLegislators] = useState<string[]>([]);
  
  // Status check for live grounded intelligence (GEMINI_API_KEY check)
  const [isLive, setIsLive] = useState<boolean>(true);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [selectedLocalState, setSelectedLocalState] = useState<string>(() => {
    return localStorage.getItem("capitol_user_local_state") || "NY";
  });

  const handleStateChange = (stateCode: string) => {
    setSelectedLocalState(stateCode);
    localStorage.setItem("capitol_user_local_state", stateCode);
  };

  // Refresh status triggers
  const [loadingAccomplishments, setLoadingAccomplishments] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingVotes, setLoadingVotes] = useState(false);

  // Initialize data on load
  useEffect(() => {
    // Read watchlist from client storage to guarantee citizen tracking state
    const saved = localStorage.getItem("capitol_watchlist");
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved));
      } catch (e) {
        console.error("Cache parsing mismatch:", e);
      }
    }

    // Read followed legislators roster list
    const savedFollows = localStorage.getItem("capitol_followed_legislators");
    if (savedFollows) {
      try {
        setFollowedLegislators(JSON.parse(savedFollows));
      } catch (e) {
        console.error("Follow parameters mismatch:", e);
      }
    }

    // Attempt automatic geolocation on startup if user hasn't selected one previously
    const hasStoredState = localStorage.getItem("capitol_user_local_state");
    if (!hasStoredState && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();
            if (data && data.principalSubdivisionCode) {
              const code = data.principalSubdivisionCode.replace("US-", "");
              if (code && code.length === 2) {
                handleStateChange(code.toUpperCase());
                console.log("Automatically set home state based on geolocation:", code);
              }
            }
          } catch (err) {
            console.error("Reverse geocoding error:", err);
          }
        },
        (err) => {
          console.warn("Geolocation prompt declined or error occurred:", err);
        }
      );
    }

    loadAccomplishments();
    loadSessions();
    loadVotes();
  }, []);

  // Save watchlist on change
  const toggleWatchlist = (id: string) => {
    let updated: string[];
    if (watchlist.includes(id)) {
      updated = watchlist.filter(item => item !== id);
    } else {
      updated = [...watchlist, id];
    }
    setWatchlist(updated);
    localStorage.setItem("capitol_watchlist", JSON.stringify(updated));
  };

  // Toggle following a legislative star roster team
  const toggleFollowLegislator = (id: string) => {
    let updated: string[];
    if (followedLegislators.includes(id)) {
      updated = followedLegislators.filter(item => item !== id);
    } else {
      updated = [...followedLegislators, id];
    }
    setFollowedLegislators(updated);
    localStorage.setItem("capitol_followed_legislators", JSON.stringify(updated));
  };

  async function loadAccomplishments() {
    try {
      setLoadingAccomplishments(true);
      const resp = await fetch("/api/legislation/accomplishments");
      const resJson = await resp.json();
      setAccomplishments(resJson.data);
      if (resJson.source === "cache" || resJson.source === "fallback") {
        setIsLive(false);
      } else {
        setIsLive(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAccomplishments(false);
    }
  }

  async function loadSessions() {
    try {
      setLoadingSessions(true);
      const resp = await fetch("/api/legislation/sessions");
      const resJson = await resp.json();
      setSessions(resJson.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSessions(false);
    }
  }

  async function loadVotes() {
    try {
      setLoadingVotes(true);
      const resp = await fetch("/api/legislation/votes");
      const resJson = await resp.json();
      setVotes(resJson.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVotes(false);
    }
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case "squad":
        return (
          <MySquadDashboard
            followedLegislators={followedLegislators}
            toggleFollowLegislator={toggleFollowLegislator}
          />
        );
      case "dashboard":
        return (
          <Dashboard
            accomplishments={accomplishments}
            onSelectBill={setSelectedBillId}
            onRefresh={loadAccomplishments}
            isLoading={loadingAccomplishments}
            watchlist={watchlist}
            toggleWatchlist={toggleWatchlist}
            followedLegislators={followedLegislators}
            toggleFollowLegislator={toggleFollowLegislator}
            selectedLocalState={selectedLocalState}
            onNavigateToTab={setActiveTab}
          />
        );
      case "bills":
        return <PlainLanguageDirectory onSelectBill={setSelectedBillId} />;
      case "state-briefing":
        return (
          <StateBriefing
            followedLegislators={followedLegislators}
            toggleFollowLegislator={toggleFollowLegislator}
            selectedLocalState={selectedLocalState}
            onStateChange={handleStateChange}
          />
        );
      case "consensus":
        return <CitizensConsensus followedLegislators={followedLegislators} />;
      case "alerts":
      case "sessions":
      case "votes":
        return (
          <RollCallVotesView
            votes={votes}
            onRefreshVotes={loadVotes}
            isLoadingVotes={loadingVotes}
            sessions={sessions}
            onRefreshSessions={loadSessions}
            isLoadingSessions={loadingSessions}
            defaultSubTab={
              activeTab === "sessions"
                ? "upcoming-debates"
                : activeTab === "alerts"
                ? "upcoming-votes"
                : "completed-votes"
            }
          />
        );
      case "chat":
        return <StandaloneChat />;
      case "voter-info":
        return (
          <VoterInformation
            selectedLocalState={selectedLocalState}
            onStateChange={handleStateChange}
          />
        );
      default:
        return (
          <div className="text-center py-20 text-stone-400">
            View under construction. Use Navigation.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F8F6] font-serif text-stone-900 overflow-x-hidden antialiased select-text">
      {/* 1. Header Navigation Component */}
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isLive={isLive} 
        onOpenDiagnostics={() => setShowDiagnostics(true)} 
      />

      {/* 2. Primary Layout Framework (Professional Polish Theme alignment) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        
        {/* Dynamic Inner View Panel */}
        <div className="animate-fade-in" id="primary-view-container">
          {renderActiveView()}
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="bg-stone-900 border-t border-stone-800 shrink-0 py-6 text-stone-400 mt-auto font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-xs space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-stone-800 text-amber-600 rounded">
              <Landmark className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-stone-200 font-display text-sm tracking-wide">CapitolTrack Civics</span>
              <p className="text-[10px] text-stone-400 font-sans">Official real-world parameters from Congress.gov & grounded search indices</p>
            </div>
          </div>
          
          <div className="flex gap-4 font-semibold text-stone-400">
            <span className="text-[10px] uppercase font-mono tracking-widest text-stone-500">Feed v5.0 (Mid-June 2026)</span>
            <span>|</span>
            <a href="https://congress.gov" target="_blank" rel="noreferrer" className="flex items-center gap-0.5 hover:text-white transition">
              Congress.gov portal <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* 4. Overlay detail analysis (Plain translation dialog + policy assistant) */}
      {selectedBillId && (
        <BillDetailModal
          billId={selectedBillId}
          onClose={() => setSelectedBillId(null)}
        />
      )}

      {/* 5. API Key Verification & System Diagnostics Dialog */}
      {showDiagnostics && (
        <ApiDiagnosticsModal
          onClose={() => setShowDiagnostics(false)}
        />
      )}
    </div>
  );
}
