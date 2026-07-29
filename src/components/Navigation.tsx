import React from "react";
import { Landmark, Sparkles, FileText, BarChart3, HelpCircle, Activity, Vote, Map, MapPin, LogOut, LogIn, Users, Newspaper } from "lucide-react";
import { useAuth } from "../AuthContext";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLive: boolean;
  onOpenDiagnostics: () => void;
}

export default function Navigation({ activeTab, setActiveTab, isLive, onOpenDiagnostics }: NavigationProps) {
  const { user, signInWithGoogle, signOut } = useAuth();
  
  const tabs = [
    { id: "dashboard", label: "Front Page", shortLabel: "Front Page", icon: Newspaper },
    { id: "squad", label: "My Squad", shortLabel: "Squad", icon: Users },
    { id: "bills", label: "Legalese Translator", shortLabel: "Translator", icon: FileText },
    { id: "state-briefing", label: "State Briefing", shortLabel: "State", icon: Map },
    { id: "consensus", label: "Citizens' Ballot", shortLabel: "Citizens'", icon: Vote },
    { id: "votes", label: "Votes & Debates", shortLabel: "Votes", icon: BarChart3 },
    { id: "voter-info", label: "Voter Info", shortLabel: "Voter", icon: MapPin },
    { id: "chat", label: "Sentinel AI Analyst", shortLabel: "AI Analyst", icon: HelpCircle },
  ];

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).toUpperCase();

  return (
    <header className="bg-[#FBF9F5] sticky top-0 z-40 select-none shadow-sm border-b-2 border-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-2">
        
        {/* Top Utility Bar (Auth & Live Diagnostics) */}
        <div className="flex items-center justify-between text-[11px] font-mono border-b border-stone-300 pb-2 mb-2 text-stone-700">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-[#1A1A1A] flex items-center gap-1">
              <Landmark className="h-3.5 w-3.5 text-stone-800 inline" />
              CAPITOL PRESS BUREAU
            </span>
            <span className="text-stone-400">|</span>
            <span className="hidden md:inline font-semibold text-stone-600">{currentDateStr}</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Live System Indicator */}
            <button
              onClick={onOpenDiagnostics}
              title="Click to verify API keys and system diagnostics"
              className="flex items-center space-x-1.5 bg-[#FAF7F0] hover:bg-stone-200 px-2.5 py-1 border border-stone-400 cursor-pointer transition-colors group"
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLive ? "bg-emerald-500" : "bg-red-500"}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? "bg-emerald-600" : "bg-red-600"}`}></span>
              </span>
              <span className="text-[9px] font-mono font-bold text-stone-800 uppercase tracking-widest flex items-center gap-1">
                {isLive ? (
                  <>
                    <Sparkles className="h-3 w-3 text-emerald-700 inline" /> Grounded Wire
                  </>
                ) : (
                  <>
                    <Activity className="h-3 w-3 text-amber-700 inline" /> Press Archive
                  </>
                )}
              </span>
            </button>

            {/* User Auth Profile */}
            <div className="flex items-center">
              {user ? (
                <button onClick={signOut} className="flex items-center space-x-1.5 px-2.5 py-1 border border-stone-400 hover:bg-stone-200 transition-colors cursor-pointer text-stone-800 font-mono text-[10px]">
                  <img src={user.photoURL || ""} alt="" className="w-4 h-4 rounded-full border border-stone-500" />
                  <span className="font-bold uppercase tracking-wider hidden sm:block">Sign Out</span>
                  <LogOut className="w-3 h-3 sm:hidden" />
                </button>
              ) : (
                <button onClick={signInWithGoogle} className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#1A1A1A] text-[#FBF9F5] hover:bg-stone-800 transition-colors cursor-pointer font-mono text-[10px]">
                  <LogIn className="w-3 h-3" />
                  <span className="font-bold uppercase tracking-wider">Citizen Login</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* BROADSHEET MASTHEAD HEADER BAR bounded by top and bottom double divider lines */}
        <div className="py-3 text-center border-y-4 border-double border-[#1A1A1A] bg-[#FBF9F5] my-1">
          {/* Sub-bar dateline top */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono font-bold text-stone-700 uppercase tracking-widest px-2 mb-1.5 border-b border-stone-300/60 pb-1">
            <span>EST. 2026 • NON-PARTISAN LEGISLATIVE PRESS</span>
            <span className="font-extrabold text-[#1A1A1A]">VOL. CXIX • WASHINGTON, D.C. • THE DAILY CIVIC LEDGER</span>
            <span className="hidden sm:inline">PRICE: FREE PUBLIC SERVICE</span>
          </div>

          {/* Main Broadsheet Title */}
          <div 
            onClick={() => setActiveTab("dashboard")} 
            className="cursor-pointer group inline-block my-2"
          >
            <h1 className="font-masthead font-black text-3xl sm:text-5xl md:text-6xl tracking-wider text-[#1A1A1A] uppercase leading-tight hover:text-stone-800 transition-colors">
              The Citizens Sentinel
            </h1>
          </div>

          {/* Tagline & Positioning */}
          <div className="mt-1">
            <p className="font-serif italic text-xs sm:text-sm font-semibold text-stone-800 tracking-wide">
              &ldquo;The Plain-Language Watchdog for the 119th Congress&rdquo;
            </p>
          </div>
        </div>

        {/* Section Navigation Tabs (Newsprint Bar) */}
        <nav className="hidden lg:flex items-center justify-between pt-2 text-xs font-mono font-bold uppercase tracking-wider border-t border-stone-300">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 py-1.5 transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#1A1A1A] text-[#FBF9F5] shadow-xs"
                    : "text-stone-800 hover:bg-stone-200/80 hover:text-[#1A1A1A]"
                }`}
              >
                <Icon className={`mr-1.5 h-3.5 w-3.5 ${isActive ? "text-[#FBF9F5]" : "text-stone-600"}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Mobile Navigation Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 -mx-4 px-4 scrollbar-none border-t border-stone-300 justify-between gap-1 mt-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-mobile-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider transition-colors ${
                  isActive
                    ? "bg-[#1A1A1A] text-[#FBF9F5]"
                    : "text-stone-700 hover:text-stone-900"
                }`}
              >
                <Icon className="h-3 w-3 mr-1" />
                {tab.shortLabel}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}

