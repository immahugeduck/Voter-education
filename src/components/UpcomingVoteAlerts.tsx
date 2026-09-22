import React, { useState, useEffect } from "react";
import { Bell, ShieldAlert, Sparkles, User, Info, ArrowUpRight, HelpCircle, Check, MapPin, Activity, CheckSquare, Loader2 } from "lucide-react";
import { UpcomingVoteAlert, LegislatorScorecard } from "../types";

export default function UpcomingVoteAlerts() {
  const [alerts, setAlerts] = useState<UpcomingVoteAlert[]>([]);
  const [legislators, setLegislators] = useState<LegislatorScorecard[]>([]);
  const [selectedLegId, setSelectedLegId] = useState<string>("leg-1"); // defaulted to elizabeth warren
  const [loading, setLoading] = useState<boolean>(true);
  const [userStateInput, setUserStateInput] = useState<string>("");
  const [userSchedules, setUserSchedules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchAlertsAndLegs() {
      try {
        setLoading(true);
        // Load Alerts
        const resAlerts = await fetch("/api/legislation/alerts");
        if (resAlerts.ok) {
          const alertsJson = await resAlerts.json();
          if (alertsJson && alertsJson.data) {
            setAlerts(alertsJson.data);
          }
        }

        // Load Legislators to support selectors
        const resLegs = await fetch("/api/legislation/legislators");
        if (resLegs.ok) {
          const legsJson = await resLegs.json();
          setLegislators(legsJson.data || []);
          if (legsJson.data && legsJson.data.length > 0) {
            const hasDefault = legsJson.data.some((l: any) => l.id === "leg-1");
            if (!hasDefault) {
              setSelectedLegId(legsJson.data[0].id);
            }
          }
        }
      } catch (err) {
        console.warn("Alerts & legislators notice:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAlertsAndLegs();
  }, []);

  const selectedLeg = legislators.find((l) => l.id === selectedLegId);

  const toggleAlertNotify = (id: string) => {
    setUserSchedules((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Informative Header Banner */}
      <div className="bg-stone-900 text-white rounded-none border border-stone-800 p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Bell className="h-32 w-32" />
        </div>
        <div className="relative max-w-xl space-y-2">
          <h2 className="text-xl font-display font-black text-stone-100 flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-500 animate-pulse" />
            Upcoming Key Legislation Votes & Predictor
          </h2>
          <p className="text-stone-455 text-xs leading-relaxed">
            Stay ahead of the floor. Track scheduled debates, receive real-time scheduling alert flashes, and view machine-grounded predictive analysis matching major representatives’ alignments on pending acts.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-[#F9F8F6] rounded-none border border-stone-200 shadow-sm">
          <Loader2 className="h-7 w-7 text-amber-500 animate-spin" />
          <span className="text-xs font-mono text-stone-500">Querying live House and Senate upcoming docket files...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Active Docket Stream (Left 8 columns) */}
          <div className="lg:col-span-8 space-y-4">
            <h3 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest px-1">
              Active Key Scheduled Floor Votes
            </h3>

            {alerts.map((alert) => {
              // Find prediction matching current selected legislator
              const predictionObj = alert.predictedVotes.find(v => v.legislatorId === selectedLegId);
              const isAlertOn = userSchedules[alert.id] || false;

              return (
                <div 
                  key={alert.id}
                  id={`alert-card-${alert.billId.replace(/\s+/g, '-').toLowerCase()}`}
                  className="bg-[#F9F8F6] rounded-none border border-stone-200/80 hover:border-stone-300 shadow-sm overflow-hidden transition"
                >
                  {/* Top scheduled state line */}
                  <div className="px-5 py-3.5 bg-stone-50 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-stone-200 text-stone-800 rounded">
                        {alert.billId}
                      </span>
                      <span className="text-[11px] font-mono text-stone-550 font-bold uppercase tracking-wider">
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
                        onClick={() => toggleAlertNotify(alert.id)}
                        className={`text-xs px-3 py-1 rounded-full font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isAlertOn 
                            ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm" 
                            : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                        }`}
                      >
                        <Bell className="h-3 w-3" />
                        <span>{isAlertOn ? "Alert Armed" : "Notify Me"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h4 className="font-sans font-extrabold text-sm text-stone-900 leading-snug">
                        {alert.billTitle}
                      </h4>
                      <p className="text-xs text-stone-600 leading-relaxed mt-2 p-3 bg-stone-50 rounded-none border border-stone-100 italic">
                        &quot;{alert.plainSummary}&quot;
                      </p>
                    </div>

                    {/* Prediction logic for active legislator */}
                    <div className="p-4 bg-stone-900 text-white rounded-none space-y-3.5 border border-stone-800">
                      <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-400" />
                          <span className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wide">
                            {selectedLeg?.name || "Representative"}&apos;s Alignment Prediction
                          </span>
                        </div>
                        {predictionObj && (
                          <span className={`text-[11px] font-mono font-extrabold px-2.5 py-0.5 rounded border ${
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
                            Grounded forecast compiled via historical sponsorships & statement registries
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-stone-400 leading-relaxed">
                          No forecast prediction available for this legislator on this bill. Choose another representative on the right panel to test prediction models.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Outbound reference links */}
                  <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-stone-400 uppercase font-semibold">
                      Official Source: Congress.gov
                    </span>
                    <a
                      href={alert.billUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      <span>Review full text draft on Congress.gov</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Representative Selector (Right 4 columns) */}
          <div className="lg:col-span-4 bg-[#F9F8F6] p-5 rounded-none border border-stone-200 shadow-sm space-y-6">
            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold tracking-widest text-stone-400 uppercase flex items-center gap-1">
                <MapPin className="h-4 w-4 text-amber-500" /> Grounded Representative
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Change your selected policy marker below to run real-time predictions across all scheduled dockets instantly:
              </p>
            </div>

            {/* Selector list */}
            <div className="space-y-2">
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

            {/* Representative Details Info Card */}
            {selectedLeg && (
              <div className="p-4.5 bg-stone-50 border border-stone-150 rounded-none space-y-3">
                <h4 className="text-[10px] font-mono font-bold text-stone-450 uppercase tracking-widest">
                  Active Focus Profile
                </h4>
                <div className="flex items-center gap-3">
                  {selectedLeg.imageUrl && (
                    <img 
                      src={selectedLeg.imageUrl} 
                      alt={selectedLeg.name} 
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 rounded-full object-cover border border-stone-200"
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
    </div>
  );
}
