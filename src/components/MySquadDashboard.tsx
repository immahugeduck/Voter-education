import React, { useState, useEffect } from "react";
import { Users, Award, Shield, FileText, ArrowUpRight, TrendingUp, X, Loader2, Download, Copy } from "lucide-react";
import { LegislatorScorecard } from "../types";

interface MySquadDashboardProps {
  followedLegislators: string[];
  toggleFollowLegislator: (id: string) => void;
}

export default function MySquadDashboard({ followedLegislators, toggleFollowLegislator }: MySquadDashboardProps) {
  const [squad, setSquad] = useState<LegislatorScorecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadSquad() {
      try {
        setLoading(true);
        const res = await fetch(`/api/legislation/legislators`);
        if (!res.ok) return;
        const json = await res.json();
        const allLegs: LegislatorScorecard[] = json.data || [];
        const drafted = allLegs.filter(l => followedLegislators.includes(l.id));
        setSquad(drafted);
      } catch (err) {
        console.warn("Squad load notice:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSquad();
  }, [followedLegislators]);

  const avgAttendance = squad.length > 0 
    ? Math.round(squad.reduce((acc, curr) => acc + curr.attendanceRate, 0) / squad.length) 
    : 0;

  const avgCAI = squad.length > 0
    ? Math.round(squad.reduce((acc, curr) => acc + (curr.libertyProsperityIndex?.overallScore || 50), 0) / squad.length)
    : 0;

  const handleCopyMarkdown = () => {
    if (squad.length === 0) return;
    
    let md = `# My Fantasy Congress Squad\n\n`;
    md += `**Overall Stats**\n`;
    md += `- Members: ${squad.length}\n`;
    md += `- Avg Attendance: ${avgAttendance}%\n`;
    md += `- Avg Constituent Alignment (CAI): ${avgCAI}\n\n`;
    md += `## Roster\n`;
    squad.forEach(leg => {
      md += `### ${leg.name} (${leg.party}-${leg.state}, ${leg.chamber})\n`;
      md += `- Attendance: ${leg.attendanceRate}%\n`;
      md += `- CAI Score: ${leg.libertyProsperityIndex?.overallScore || 'N/A'}\n`;
      md += `- Sponsored Bills: ${leg.billsSponsored}\n\n`;
    });

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
        <span className="text-xs font-mono text-stone-500">Loading squad analytics...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-stone-800 pb-4 gap-4">
        <div>
          <h1 className="font-display font-black text-3xl tracking-tighter text-stone-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-amber-600" /> My Squad
          </h1>
          <p className="text-sm font-sans text-stone-500 mt-1 max-w-2xl leading-relaxed">
            Manage your drafted Fantasy Congress representatives. Monitor their aggregated attendance, alignment scores, and overall productivity.
          </p>
        </div>
        
        {squad.length > 0 && (
          <div className="flex gap-2">
            <button 
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
            >
              {copied ? <span className="text-emerald-600">Copied!</span> : <><Copy className="h-4 w-4" /> Export Markdown</>}
            </button>
          </div>
        )}
      </div>

      {squad.length === 0 ? (
        <div className="bg-stone-50 border border-stone-200 p-12 text-center flex flex-col items-center">
          <Shield className="h-12 w-12 text-stone-300 mb-3" />
          <h3 className="text-lg font-bold text-stone-800 font-display">No Lawmakers Drafted</h3>
          <p className="text-sm text-stone-500 max-w-md mt-2">
            Visit the Dashboard or State Briefing tabs and click "Draft Politician" to build your squad.
          </p>
        </div>
      ) : (
        <>
          {/* Team Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#F9F8F6] p-5 border border-stone-200 flex flex-col justify-center">
              <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest mb-1 block">Avg Attendance</span>
              <span className="text-3xl font-display font-black text-stone-900">{avgAttendance}%</span>
            </div>
            <div className="bg-[#F9F8F6] p-5 border border-stone-200 flex flex-col justify-center">
              <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest mb-1 block">Collective CAI Score</span>
              <span className="text-3xl font-display font-black text-stone-900">{avgCAI}</span>
            </div>
            <div className="bg-[#F9F8F6] p-5 border border-stone-200 flex flex-col justify-center">
              <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest mb-1 block">Squad Size</span>
              <span className="text-3xl font-display font-black text-stone-900">{squad.length} <span className="text-sm text-stone-400 font-sans font-normal">members</span></span>
            </div>
          </div>

          {/* Grid of Drafted Members */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {squad.map(member => (
              <div key={member.id} className="bg-white border border-stone-200 p-4 relative group hover:border-stone-300 transition-colors">
                <button 
                  onClick={() => toggleFollowLegislator(member.id)}
                  className="absolute top-2 right-2 p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                  title="Remove from Squad"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-none flex items-center justify-center border font-display font-black text-lg ${
                    member.party === "D" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    member.party === "R" ? "bg-rose-50 text-rose-700 border-rose-200" :
                    "bg-stone-50 text-stone-700 border-stone-200"
                  }`}>
                    {member.party}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-900 leading-tight pr-6">{member.name}</h3>
                    <div className="text-[10px] font-mono text-stone-500 mt-0.5">{member.chamber} • {member.state}</div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-500">Attendance</span>
                    <span className="font-bold text-stone-800">{member.attendanceRate}%</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-500">CAI Alignment</span>
                    <span className="font-bold text-stone-800">{member.libertyProsperityIndex?.overallScore || 50}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-500">Bills Sponsored</span>
                    <span className="font-bold text-stone-800">{member.billsSponsored}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
