import React, { useState } from "react";
import { Search, MapPin, CheckCircle, AlertTriangle, ShieldCheck, Mail, Phone, ExternalLink } from "lucide-react";

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

interface VoterInformationProps {
  selectedLocalState: string;
  onStateChange: (stateCode: string) => void;
}

export default function VoterInformation({ selectedLocalState, onStateChange }: VoterInformationProps) {
  const [address, setAddress] = useState("");
  const [voterInfo, setVoterInfo] = useState<Record<string, any> | null>(null);
  const [elections, setElections] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchElections = async () => {
    try {
      const resp = await fetch("/api/civic/elections");
      if (!resp.ok) {
        throw new Error("Failed to fetch elections");
      }
      const data = await resp.json();
      setElections(data.elections || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setLoading(true);
    setError(null);
    setVoterInfo(null);

    try {
      const resp = await fetch(`/api/civic/voterinfo?address=${encodeURIComponent(address)}`);
      const data = await resp.json();
      
      if (!resp.ok) {
        throw new Error(data.error || "Failed to fetch voter information");
      }

      setVoterInfo(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchElections();
  }, []);

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------
          HOME JURISDICTION STATE SELECTOR CARD
         ---------------------------------------------------- */}
      <div className="bg-[#F9F8F6] rounded-none shadow-sm border border-stone-200 overflow-hidden p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 flex-1">
            <div className="inline-flex items-center space-x-1.5 p-1 px-2.5 bg-red-50 text-red-700 rounded-full text-[10px] font-mono tracking-wider font-bold">
              <MapPin className="h-3.5 w-3.5" />
              <span>HOME JURISDICTION STATE</span>
            </div>
            <h3 className="text-lg font-bold font-sans tracking-tight text-stone-900">
              Set Your Legislative Focus State
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Your selected state controls customized alerts, representative scorecards, and media briefs tailored specifically to your home district, displayed directly on the main **Dashboard** and **Citizens' Consensus** match comparisons.
            </p>
          </div>
          
          <div className="bg-stone-50 p-4 rounded-none border border-stone-200 flex-shrink-0 w-full md:w-80 space-y-3">
            <label htmlFor="local-state-select-voter-info" className="text-[11px] font-mono text-stone-505 font-bold uppercase tracking-wider block">
              Active Focus State:
            </label>
            <select
              id="local-state-select-voter-info"
              value={selectedLocalState}
              onChange={(e) => onStateChange(e.target.value)}
              className="w-full bg-[#F9F8F6] text-stone-900 border border-stone-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-none py-2 px-3 text-xs font-semibold focus:outline-none transition-colors cursor-pointer"
            >
              {Object.entries(STATE_NAMES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name} ({code})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-stone-500 italic">
              Focusing on: <strong className="text-stone-750">{STATE_NAMES[selectedLocalState] || selectedLocalState}</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#F9F8F6] rounded-none shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-100 bg-stone-50/50">
          <h2 className="text-xl font-bold font-sans tracking-tight text-stone-900 mb-2">Voter Information Lookup</h2>
          <p className="text-sm text-stone-500 mb-6">
            Enter your registered voting address to find upcoming elections, polling locations, and representative information. Powered by the Google Civic Information API.
          </p>
          
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-stone-400" />
            </div>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your full registered address (e.g., 1263 Pacific Ave, Santa Cruz, CA)"
              className="block w-full pl-10 pr-24 py-3 sm:text-sm border-stone-200 rounded-none focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !address.trim()}
              className="absolute inset-y-1.5 right-1.5 px-4 bg-stone-900 text-white text-sm font-medium rounded-md hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Lookup
                </>
              )}
            </button>
          </form>
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-none flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        {voterInfo && (
          <div className="p-6 space-y-8">
            {/* Election Details */}
            {voterInfo.election && (
              <div>
                <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  Upcoming Election
                </h3>
                <div className="bg-blue-50 rounded-none p-4 border border-blue-100">
                  <div className="font-semibold text-blue-900 text-lg">{voterInfo.election.name}</div>
                  <div className="text-blue-700 mt-1">Date: {voterInfo.election.electionDay}</div>
                </div>
              </div>
            )}

            {/* Polling Locations */}
            {voterInfo.pollingLocations && voterInfo.pollingLocations.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-stone-900 mb-4">Polling Locations</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {voterInfo.pollingLocations.map((loc: Record<string, any>, idx: number) => (
                    <div key={idx} className="border border-stone-200 rounded-none p-4 bg-[#F9F8F6]">
                      <div className="font-medium text-stone-900">{loc.address?.locationName || "Polling Place"}</div>
                      <div className="text-stone-600 text-sm mt-1">
                        {loc.address?.line1}<br />
                        {loc.address?.city}, {loc.address?.state} {loc.address?.zip}
                      </div>
                      {loc.pollingHours && (
                        <div className="text-sm text-stone-500 mt-3 flex items-start gap-2">
                          <span className="font-medium text-stone-700">Hours:</span> {loc.pollingHours}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* State Information */}
            {voterInfo.state && voterInfo.state.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-stone-900 mb-4">State Election Information</h3>
                {voterInfo.state.map((state: Record<string, any>, idx: number) => (
                  <div key={idx} className="border border-stone-200 rounded-none p-4 bg-[#F9F8F6]">
                    <div className="font-bold text-lg text-stone-900 mb-3">{state.name}</div>
                    
                    {state.electionAdministrationBody && (
                      <div className="space-y-3">
                        <div className="font-medium text-stone-700">{state.electionAdministrationBody.name}</div>
                        
                        {state.electionAdministrationBody.electionInfoUrl && (
                          <a href={state.electionAdministrationBody.electionInfoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Election Information Website
                          </a>
                        )}
                        {state.electionAdministrationBody.electionRegistrationUrl && (
                          <a href={state.electionAdministrationBody.electionRegistrationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Voter Registration
                          </a>
                        )}
                        {state.electionAdministrationBody.electionRegistrationConfirmationUrl && (
                          <a href={state.electionAdministrationBody.electionRegistrationConfirmationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Confirm Registration
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Contests */}
            {voterInfo.contests && voterInfo.contests.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-stone-900 mb-4">Ballot Contests</h3>
                <div className="space-y-4">
                  {voterInfo.contests.map((contest: Record<string, any>, idx: number) => (
                    <div key={idx} className="border border-stone-200 rounded-none overflow-hidden">
                      <div className="bg-stone-50 px-4 py-3 border-b border-stone-200">
                        <div className="font-bold text-stone-900">{contest.office || contest.referendumTitle}</div>
                        {contest.type && <div className="text-xs font-medium text-stone-500 uppercase mt-1">{contest.type}</div>}
                      </div>
                      
                      {contest.candidates && contest.candidates.length > 0 && (
                        <div className="p-4 divide-y divide-stone-100">
                          {contest.candidates.map((candidate: Record<string, any>, cIdx: number) => (
                            <div key={cIdx} className="py-3 first:pt-0 last:pb-0">
                              <div className="font-medium text-stone-900">{candidate.name}</div>
                              {candidate.party && <div className="text-sm text-stone-600">{candidate.party}</div>}
                              
                              <div className="mt-2 flex flex-wrap gap-3">
                                {candidate.candidateUrl && (
                                  <a href={candidate.candidateUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800">
                                    <ExternalLink className="h-3 w-3 mr-1" /> Website
                                  </a>
                                )}
                                {candidate.email && (
                                  <a href={`mailto:${candidate.email}`} className="inline-flex items-center text-xs text-stone-600 hover:text-stone-900">
                                    <Mail className="h-3 w-3 mr-1" /> Email
                                  </a>
                                )}
                                {candidate.phone && (
                                  <a href={`tel:${candidate.phone}`} className="inline-flex items-center text-xs text-stone-600 hover:text-stone-900">
                                    <Phone className="h-3 w-3 mr-1" /> Phone
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {contest.referendumText && (
                        <div className="p-4 text-sm text-stone-700 bg-[#F9F8F6]">
                          <p>{contest.referendumText}</p>
                          {contest.referendumSubtitle && <p className="mt-2 text-stone-500 italic">{contest.referendumSubtitle}</p>}
                          {contest.referendumUrl && (
                            <a href={contest.referendumUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 mt-3">
                              <ExternalLink className="h-3 w-3 mr-1" /> Read More
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Active Elections Overview (Only shown when not searching specific address) */}
      {!voterInfo && elections.length > 0 && (
        <div className="bg-[#F9F8F6] rounded-none shadow-sm border border-stone-200 p-6">
          <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center">
            <ShieldCheck className="h-5 w-5 mr-2 text-stone-700" />
            Currently Active Elections
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {elections.map((election: Record<string, any>) => (
              <div key={election.id} className="p-4 border border-stone-100 rounded-none bg-stone-50 hover:bg-stone-100 transition-colors">
                <div className="font-medium text-stone-900 text-sm line-clamp-2">{election.name}</div>
                <div className="text-stone-500 text-xs mt-2 flex justify-between items-center">
                  <span>{election.electionDay}</span>
                  <span className="font-mono text-stone-400">ID: {election.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
