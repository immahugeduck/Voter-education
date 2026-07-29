import React from "react";
import { Landmark, Sparkles, FileText, CalendarDays, BarChart3, HelpCircle, Activity, Award, Bell, Vote, Map, MapPin, LogOut, LogIn, Users } from "lucide-react";
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
    { id: "dashboard", label: "Dashboard", shortLabel: "Dashboard", icon: Landmark },
    { id: "squad", label: "My Squad", shortLabel: "Squad", icon: Users },
    { id: "bills", label: "Legalese Translator", shortLabel: "Translator", icon: FileText },
    { id: "state-briefing", label: "State Briefing", shortLabel: "State", icon: Map },
    { id: "consensus", label: "Citizens' Ballot", shortLabel: "Citizens'", icon: Vote },
    { id: "votes", label: "Votes & Debates", shortLabel: "Votes", icon: BarChart3 },
    { id: "voter-info", label: "Voter Info", shortLabel: "Voter", icon: MapPin },
    { id: "chat", label: "CapitolExpert AI", shortLabel: "Expert AI", icon: HelpCircle },
  ];

  return (
    <header className="bg-[#F9F8F6] border-b-2 border-stone-800 sticky top-0 z-40 select-none shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab("dashboard")}>
            <div className="p-1.5 border border-stone-800 bg-stone-900 text-[#F9F8F6] group-hover:bg-stone-800 transition-colors">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display font-black text-2xl tracking-tighter text-stone-900">The Capitol<span className="text-stone-500 font-serif italic font-normal ml-0.5">Track</span></span>
              <div className="text-[9px] font-sans text-stone-500 uppercase tracking-widest font-bold">119th Congress Edition</div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex space-x-2" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-1.5 text-sm font-sans font-bold uppercase tracking-wider rounded-none transition-all duration-250 cursor-pointer ${
                    isActive
                      ? "text-stone-900 border-b-2 border-stone-900 bg-stone-200/50"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
                  }`}
                >
                  <Icon className={`mr-1.5 h-4 w-4 ${isActive ? "text-stone-900" : "text-stone-400 group-hover:text-stone-600"}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center space-x-3">
            {/* Live System Indicator */}
            <button
              onClick={onOpenDiagnostics}
              title="Click to verify API keys and system diagnostics"
              className="hidden sm:flex items-center space-x-2 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 border border-stone-300 cursor-pointer transition-colors group"
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLive ? "bg-emerald-500" : "bg-red-500"}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? "bg-emerald-600" : "bg-red-600"}`}></span>
              </span>
              <span className="text-[9px] font-sans font-bold text-stone-600 uppercase tracking-widest flex items-center gap-1 group-hover:text-stone-900 transition-colors">
                {isLive ? (
                  <>
                    <Sparkles className="h-3 w-3 text-emerald-600 inline" /> Grounded AI
                  </>
                ) : (
                  <>
                    <Activity className="h-3 w-3 text-red-600 inline" /> Archive Cache
                  </>
                )}
              </span>
            </button>

            {/* User Auth Profile */}
            <div className="flex items-center">
              {user ? (
                <button onClick={signOut} className="flex items-center space-x-1.5 px-3 py-1.5 border border-stone-300 hover:bg-stone-200 transition-colors cursor-pointer text-stone-700">
                  <img src={user.photoURL || ""} alt="" className="w-5 h-5 rounded-full border border-stone-400" />
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider hidden sm:block">Sign Out</span>
                  <LogOut className="w-3 h-3 sm:hidden" />
                </button>
              ) : (
                <button onClick={signInWithGoogle} className="flex items-center space-x-1.5 px-3 py-1.5 bg-stone-900 text-[#F9F8F6] hover:bg-stone-800 transition-colors cursor-pointer">
                  <LogIn className="w-4 h-4" />
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider hidden sm:block">Citizen Login</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 -mx-4 px-4 scrollbar-none border-t border-stone-300 justify-between gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-mobile-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center px-3 py-1.5 text-xs font-sans font-bold uppercase tracking-wider rounded-none transition-colors ${
                  isActive
                    ? "bg-stone-200 text-stone-900"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Icon className="h-3.5 w-3.5 mr-1" />
                {tab.shortLabel}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
