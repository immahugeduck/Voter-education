import React from "react";
import { CalendarDays, MapPin, Clock, Tag, ChevronDown, RefreshCw, Layers, Bell } from "lucide-react";
import { LegislativeSession } from "../types";

interface LegislativeSessionsProps {
  sessions: LegislativeSession[];
  onRefresh: () => void;
  isLoading: boolean;
}

export default function LegislativeSessions({ sessions, onRefresh, isLoading }: LegislativeSessionsProps) {

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-black text-stone-100 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-amber-500" />
            Upcoming Congressional Calendar
          </h2>
          <p className="text-xs text-stone-400">Scheduled chamber floor debates and committee hearings for the 119th Congress (June 2026)</p>
        </div>

        <button
          onClick={onRefresh}
          id="refresh-calendar-schedules"
          disabled={isLoading}
          className="self-start sm:self-center px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-stone-205 rounded-none text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Synchronizing Gavel..." : "Refresh Schedule"}
        </button>
      </div>

      {/* Calendar List */}
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

                  {/* Topic and Details heading */}
                  <div>
                    <h3 className="text-base font-display font-black text-stone-100">
                      {session.topic}
                    </h3>
                    <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                      {session.details}
                    </p>
                  </div>
                </div>

                <div className="flex items-center md:items-end justify-between md:flex-col gap-2 border-t md:border-t-0 border-stone-850 pt-3 md:pt-0">
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-stone-500 uppercase">Debated date</div>
                    <div className="text-sm font-bold text-stone-300 mt-0.5">{session.date}</div>
                  </div>
                  
                  <button
                    onClick={() => alert(`Alert requested for: ${session.topic}. CapitolTrack will ping you when live feeds start.`)}
                    className="p-1.5 px-3 bg-stone-800/80 border border-stone-750 hover:bg-stone-700/80 hover:text-amber-400 text-stone-400 text-xs font-semibold rounded-none transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    <span>Watch live notify</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
