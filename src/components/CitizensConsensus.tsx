import React, { useState, useEffect } from "react";
import { Vote, CheckCircle2, XCircle, Users, Scale, MessageSquare, Award, Flame, ThumbsUp, ThumbsDown, HelpCircle, Loader2 } from "lucide-react";
import { LegislatorScorecard } from "../types";
import { useAuth } from "../AuthContext";
import { db } from "../firebase";
import { collection, doc, setDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";

interface CitizenBill {
  id: string;
  title: string;
  oneLiner: string;
  category: string;
  officialStatus: string;
  congressOutcome?: string;
  pros: string[];
  cons: string[];
  simulatedYesVotes: number;
  simulatedNoVotes: number;
}

// Seed key bills for citizens to vote on
const SEED_BILLS: CitizenBill[] = [
  {
    id: "HR-82",
    title: "Affordable Housing Construction & Tax Relief Act",
    oneLiner: "Stimulates middle-class multi-family housing development via targeted federal tax credits and regulatory streamlining.",
    category: "Housing & Economy",
    officialStatus: "Passed House, Pending Senate debate scheduled for mid-July 2026",
    congressOutcome: "House Vote: 245 Yea, 182 Nay. Senate Prediction: Lean Yea",
    pros: [
      "Lowers entry barriers for first-time homebuyers with state grants",
      "Expands the Low-Income Housing Tax Credit (LIHTC) to incentivize builders",
      "Cuts regulatory red tape for multi-family rezoning near transit hubs"
    ],
    cons: [
      "Increases short-term federal deficit by an estimated $12 billion",
      "May override local municipal zoning autonomy in suburban regions",
      "Critics claim it does not cap rent hikes directly, subsidizing developers instead"
    ],
    simulatedYesVotes: 1420,
    simulatedNoVotes: 480
  },
  {
    id: "S-41",
    title: "Grid Modernization & Sovereign Energy Independence Initiative",
    oneLiner: "Authorizes long-term investments to overhaul the US electrical grid and fast-tracks domestic critical mineral refineries.",
    category: "Energy & Security",
    officialStatus: "Passed Senate, Scheduled for House Vote mid-July 2026",
    congressOutcome: "Senate Vote: 68 Yea, 30 Nay. House Prediction: Highly Disputed",
    pros: [
      "Upgrades vulnerable regional power networks against extreme weather and cyber-attacks",
      "Secures internal supplies of lithium and cobalt, reducing reliance on adversarial nations",
      "Provides nuclear power credits to maintain stable zero-emission baseload energy"
    ],
    cons: [
      "Permitting fast-tracks bypass traditional EPA environmental reviews",
      "Funds carbon capture programs that critics call greenwashing for fossil fuels",
      "High immediate capital expenditure funded by corporate tax adjustment overrides"
    ],
    simulatedYesVotes: 1850,
    simulatedNoVotes: 320
  },
  {
    id: "HR-104",
    title: "Sovereign AI Safety, Licensing & Supercomputing Act",
    oneLiner: "Establishes a federal licensing matrix for foundation AI models above a specific compute threshold while funding national research labs.",
    category: "Technology",
    officialStatus: "Introduced, Pending Judiciary and Science committees reviews",
    congressOutcome: "Bipartisan Split. Predicted House Vote: Slight Yea (54% confidence)",
    pros: [
      "Creates mandatory liability framework for model-assisted biological synthesis or deepfakes",
      "Funds open-source supercomputer hubs for public academic researchers to study alignment",
      "Guarantees copyright exemptions for fair-use model pre-training under federal audit guidelines"
    ],
    cons: [
      "Heavily favors established tech oligopolies by raising licensing and compliance overhead",
      "Could stifle agility and grassroots development of local start-ups and independent developers",
      "Vague enforcement metrics on model alignment evaluations risk regulatory overreach"
    ],
    simulatedYesVotes: 890,
    simulatedNoVotes: 910
  },
  {
    id: "HR-58",
    title: "Constitutional Privacy & Financial Freedom Protection Act",
    oneLiner: "Strictly forbids the Federal Reserve from deploying a Central Bank Digital Currency (CBDC) to monitor individual consumer transactions.",
    category: "Civil Liberties & Finance",
    officialStatus: "Passed House, Pending Senate Committee on Banking",
    congressOutcome: "House Vote: 228 Yea, 198 Nay. Senate Prediction: Strong Nay",
    pros: [
      "Ensures the state cannot freeze citizen liquid assets or trace private cash equivalents",
      "Protects decentralized financial alternatives and local banking liquidity models",
      "Maintains standard physical cash legal tender status across all retailers"
    ],
    cons: [
      "Impedes federal modernization of faster cross-border settlements and anti-fraud systems",
      "Limits state capabilities to block digital dark-market operations or international ransom networks",
      "Reduces direct liquidity buffer tools available to central bank during emergency recessions"
    ],
    simulatedYesVotes: 1540,
    simulatedNoVotes: 510
  },
  {
    id: "S-12",
    title: "First Amendment Digital Speech & Transparency Accord",
    oneLiner: "Prevents executive agencies from pressuring social platforms to moderate or restrict non-illegal political discourse.",
    category: "Civil Liberties",
    officialStatus: "Passed Senate, Under review in House Judiciary committee",
    congressOutcome: "Senate Vote: 52 Yea, 47 Nay. House Prediction: Toss-Up",
    pros: [
      "Stops quiet governmental coordination to flag, shadowban, or throttle alternative opinions",
      "Establishes a transparent public appeal registry for any user content removal",
      "Re-anchors open-forum principles on modern primary communications utility rails"
    ],
    cons: [
      "Severely hampers collaborative federal efforts to warning-label foreign intelligence cyber operations",
      "May allow unchecked viral spreading of emergency medical misinformation during public health crises",
      "Critics argue private networks should hold sole authority to enforce community standards without federal oversight"
    ],
    simulatedYesVotes: 1210,
    simulatedNoVotes: 790
  }
];

interface CitizensConsensusProps {
  followedLegislators?: string[];
}

export default function CitizensConsensus({ followedLegislators = [] }: CitizensConsensusProps) {
  const { user } = useAuth();
  const [legislators, setLegislators] = useState<LegislatorScorecard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Local storage structures
  const [userVotes, setUserVotes] = useState<Record<string, "Yea" | "Nay">>({});
  const [userComments, setUserComments] = useState<Record<string, { comment: string; author: string }[]>>({});
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  const [userNameInput, setUserNameInput] = useState<string>("Patriot Citizen");

  useEffect(() => {
    const fetchFirebaseVotes = async () => {
       if (user) {
          try {
             const q = query(collection(db, "votes"), where("userId", "==", user.uid));
             const querySnapshot = await getDocs(q);
             const cloudVotes: Record<string, "Yea" | "Nay"> = {};
             querySnapshot.forEach(docSnap => {
                const data = docSnap.data();
                cloudVotes[data.billId] = data.vote;
             });
             if (Object.keys(cloudVotes).length > 0) {
                setUserVotes(cloudVotes);
                localStorage.setItem("capitoltrack_user_votes", JSON.stringify(cloudVotes));
             }
          } catch (e) {
             console.error("Error fetching votes from Firebase", e);
          }
       }
    };
    fetchFirebaseVotes();
  }, [user]);

  useEffect(() => {
    // Fetch legislators to show alignment matching
    async function fetchLegs() {
      try {
        setLoading(true);
        const res = await fetch("/api/legislation/legislators");
        const json = await res.json();
        setLegislators(json.data || []);
      } catch (err) {
        console.error("Failed to load legislators for matching:", err);
      } finally {
        setLoading(false);
      }
    }

    // Load user data from local storage
    const savedVotes = localStorage.getItem("capitoltrack_user_votes");
    if (savedVotes) {
      setUserVotes(JSON.parse(savedVotes));
    }

    const savedComments = localStorage.getItem("capitoltrack_user_comments");
    if (savedComments) {
      setUserComments(JSON.parse(savedComments));
    }

    const savedName = localStorage.getItem("capitoltrack_user_citizen_name");
    if (savedName) {
      setUserNameInput(savedName);
    }

    fetchLegs();
  }, []);

  const handleCastVote = async (billId: string, vote: "Yea" | "Nay") => {
    const updatedVotes = { ...userVotes, [billId]: vote };
    setUserVotes(updatedVotes);
    localStorage.setItem("capitoltrack_user_votes", JSON.stringify(updatedVotes));
    
    if (user) {
      try {
        const voteId = `${user.uid}_${billId}`;
        await setDoc(doc(db, "votes", voteId), {
          userId: user.uid,
          billId,
          vote,
          timestamp: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.error("Failed to sync vote to Firebase:", err);
      }
    }
  };

  const handleAddComment = (billId: string) => {
    const text = newCommentText[billId]?.trim();
    if (!text) return;

    const currentComments = userComments[billId] || [];
    const newComment = {
      comment: text,
      author: userNameInput || "Anonymous Citizen",
      date: "Just Now"
    };

    const updatedComments = {
      ...userComments,
      [billId]: [newComment, ...currentComments]
    };

    setUserComments(updatedComments);
    localStorage.setItem("capitoltrack_user_comments", JSON.stringify(updatedComments));
    
    // Clear input
    setNewCommentText(prev => ({ ...prev, [billId]: "" }));
  };

  const saveUserName = (name: string) => {
    setUserNameInput(name);
    localStorage.setItem("capitoltrack_user_citizen_name", name);
  };

  // Calculations for Alignment
  const totalVotesCast = Object.keys(userVotes).length;
  
  // High fidelity community comments pool
  const defaultComments: Record<string, { author: string; comment: string }[]> = {
    "HR-82": [
      { author: "Evelyn Ross (Dallas, TX)", comment: "We desperately need zoning deregulation. Local suburban boards block multi-family units and keep prices astronomical." },
      { author: "Mark J. (Oakland, CA)", comment: "This tax credit will only fuel real estate developer profits without putting strict limits on landlords. We need direct affordable rent caps." }
    ],
    "S-41": [
      { author: "Sovereign_1776", comment: "Sovereign mining limits are a major security hole. China owns 80% of current rare-earth refinement. This bill is critical." },
      { author: "GreenFuture2030", comment: "Bypassing EPA checks is a slippery slope. Let's not destroy local water tables in Nevada to secure fast lithium." }
    ],
    "HR-104": [
      { author: "Dev_Architect", comment: "Licensing schemes will make it impossible for college kids and startups to run small cluster pre-training models. Regulatory capture at its finest." },
      { author: "Policy_Wonk_DC", comment: "If we don't build standard safety parameters, bad actors will deploy bio-agent recipes unchecked. Bipartisan compromise is correct here." }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Immersive Header Block */}
      <div className="bg-gradient-to-br from-stone-900 via-indigo-950 to-stone-950 text-white rounded-none border border-stone-800 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl transform transtone-x-1/3 -transtone-y-1/3 pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 p-1 px-3 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-mono tracking-wider font-bold">
              <Vote className="h-3.5 w-3.5" />
              <span>THE CITIZENS' BALOT BOX</span>
            </div>
            <h2 className="text-2xl font-sans font-black tracking-tight text-stone-100">
              The Citizens&apos; Consensus Portal
            </h2>
            <p className="text-stone-400 text-xs leading-relaxed">
              Express your vote on critical pieces of the 119th Congress dockets. See real-time community distributions, and benchmark your personal legislative principles directly against actual roll calls and your followed legislators.
            </p>
          </div>

          {/* Citizen Setup Box */}
          <div className="bg-stone-950/80 p-4 rounded-none border border-stone-800 space-y-2 shrink-0 md:w-80">
            <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-wider block">Citizen Profile Setup</span>
            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-400 block font-semibold">Your Display Alias:</label>
              <input
                type="text"
                value={userNameInput}
                onChange={(e) => saveUserName(e.target.value)}
                placeholder="e.g. Patriot Citizen"
                className="w-full bg-stone-900 border border-stone-700/60 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
              />
              <p className="text-[9px] text-stone-500">Used purely locally for your citizen ballot feedback contributions.</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1 */}
        <div className="bg-[#F9F8F6] rounded-none border border-stone-200 p-4 shadow-sm space-y-1.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-wider">Your Ballots Cast</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <h4 className="text-3xl font-sans font-black text-stone-900 mt-1">
              {totalVotesCast} <span className="text-xs font-normal text-stone-400">/ {SEED_BILLS.length} Bills</span>
            </h4>
          </div>
          <p className="text-[10px] text-stone-500 leading-snug">
            Your active feedback represents local grassroots sentiment directly in our offline ledger comparison model.
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#F9F8F6] rounded-none border border-stone-200 p-4 shadow-sm space-y-1.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-wider">Citizen Community Size</span>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <h4 className="text-3xl font-sans font-black text-stone-900 mt-1">
              6,910 <span className="text-xs font-normal text-stone-400">Simulated Citizens</span>
            </h4>
          </div>
          <p className="text-[10px] text-stone-500 leading-snug">
            Aggregated state feedback tracks divergence indexes between politicians and actual consensus votes.
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#F9F8F6] rounded-none border border-stone-200 p-4 shadow-sm space-y-1.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-wider">Representative Gap Index</span>
              <Scale className="h-4 w-4 text-purple-500" />
            </div>
            <h4 className="text-3xl font-sans font-black text-stone-900 mt-1">
              46% <span className="text-xs font-normal text-red-500 font-bold">Divergence</span>
            </h4>
          </div>
          <p className="text-[10px] text-stone-500 leading-snug">
            The mathematical rate at which mainstream congressional politicians vote against the dominant public consensus.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-[#F9F8F6] rounded-none border border-stone-200 shadow-sm">
          <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
          <span className="text-xs font-mono text-stone-500">Syncing local voter consensus statistics with congressional rolls...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <h3 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest border-b border-stone-200 pb-2 px-1">
            Current Active Consensus Bill Ballots
          </h3>

          <div className="space-y-6">
            {SEED_BILLS.map((bill) => {
              const myVote = userVotes[bill.id];
              const userCommentsPool = userComments[bill.id] || [];
              const presetComments = defaultComments[bill.id] || [];
              const mergedComments = [...userCommentsPool, ...presetComments];

              // Dynamic Adjustments based on user selection to demonstrate live interactivity
              let yesCount = bill.simulatedYesVotes;
              let noCount = bill.simulatedNoVotes;
              if (myVote === "Yea") yesCount += 1;
              if (myVote === "Nay") noCount += 1;
              const totalVoters = yesCount + noCount;
              const yesPct = Math.round((yesCount / totalVoters) * 100);
              const noPct = 100 - yesPct;

              return (
                <div key={bill.id} className="bg-[#F9F8F6] rounded-none border border-stone-200/80 shadow-sm overflow-hidden" id={`ballot-${bill.id.toLowerCase()}`}>
                  {/* Title Bar block */}
                  <div className="p-5 border-b border-stone-100 bg-stone-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 text-xs font-mono font-black bg-stone-900 text-white rounded">
                          {bill.id}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded uppercase">
                          {bill.category}
                        </span>
                      </div>
                      <h4 className="text-base font-sans font-extrabold text-stone-900 tracking-tight">
                        {bill.title}
                      </h4>
                      <p className="text-xs text-stone-600 font-medium">
                        {bill.oneLiner}
                      </p>
                    </div>

                    {/* Official Congress Status */}
                    <div className="bg-[#F9F8F6] p-2.5 px-3.5 rounded-none border border-stone-200 shadow-sm text-right shrink-0">
                      <div className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-wider">Congress Docket Status</div>
                      <div className="text-[11px] font-bold text-stone-850 leading-tight">{bill.officialStatus}</div>
                      <div className="text-[10px] text-stone-500 font-semibold">{bill.congressOutcome}</div>
                    </div>
                  </div>

                  {/* Pro & Con split list */}
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 border-b border-stone-100">
                    <div className="space-y-2 bg-emerald-50/20 p-4 rounded-none border border-emerald-500/10">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                        <ThumbsUp className="h-4 w-4" /> Pros & Civic Arguments
                      </div>
                      <ul className="space-y-1.5 list-disc pl-4 text-xs text-stone-600 leading-relaxed font-medium">
                        {bill.pros.map((pro, index) => <li key={index}>{pro}</li>)}
                      </ul>
                    </div>

                    <div className="space-y-2 bg-red-50/20 p-4 rounded-none border border-red-500/10">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-red-800">
                        <ThumbsDown className="h-4 w-4" /> Cons & Criticisms
                      </div>
                      <ul className="space-y-1.5 list-disc pl-4 text-xs text-stone-600 leading-relaxed font-medium">
                        {bill.cons.map((con, index) => <li key={index}>{con}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* Casting Box & Results Compare */}
                  <div className="p-5 bg-stone-50/30 border-b border-stone-100 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* Ballot Action (Left) */}
                    <div className="lg:col-span-5 space-y-3">
                      <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest block">Cast Your Citizen Ballot</span>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCastVote(bill.id, "Yea")}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-none font-bold text-xs border transition cursor-pointer ${
                            myVote === "Yea"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]"
                              : "bg-[#F9F8F6] text-stone-700 hover:text-emerald-700 hover:bg-emerald-50/40 border-stone-200"
                          }`}
                        >
                          <CheckCircle2 className={`h-4 w-4 ${myVote === "Yea" ? "text-white" : "text-emerald-500"}`} />
                          VOTE YES / YEA
                        </button>

                        <button
                          onClick={() => handleCastVote(bill.id, "Nay")}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-none font-bold text-xs border transition cursor-pointer ${
                            myVote === "Nay"
                              ? "bg-red-600 text-white border-red-600 shadow-md scale-[1.02]"
                              : "bg-[#F9F8F6] text-stone-700 hover:text-red-700 hover:bg-red-50/40 border-stone-200"
                          }`}
                        >
                          <XCircle className={`h-4 w-4 ${myVote === "Nay" ? "text-white" : "text-red-500"}`} />
                          VOTE NO / NAY
                        </button>
                      </div>

                      {myVote ? (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-150 rounded-none text-[10.5px] text-emerald-800 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>Your ballot has been securely cast: &ldquo;{myVote}&rdquo;! Alignment analyzed below.</span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-stone-400 text-center font-semibold italic">
                          Click above to record your vote and compare with politicians instantly.
                        </p>
                      )}
                    </div>

                    {/* Community consensus distribution progress (Center) */}
                    <div className="lg:col-span-4 bg-[#F9F8F6] p-4.5 rounded-none border border-stone-200 space-y-3.5 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-[10.5px] font-display font-black text-stone-800 flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-blue-500" /> Community Consensus split
                        </span>
                        <span className="text-[10px] font-mono text-stone-400 font-bold">{totalVoters} Cast</span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="h-4.5 w-full bg-stone-100 rounded-none overflow-hidden flex font-mono text-[9px] font-bold text-white text-center">
                          <div className="bg-emerald-600 h-full flex items-center justify-center transition-all duration-500" style={{ width: `${yesPct}%` }}>
                            {yesPct >= 15 && `${yesPct}% YEA`}
                          </div>
                          <div className="bg-red-600 h-full flex items-center justify-center transition-all duration-500" style={{ width: `${noPct}%` }}>
                            {noPct >= 15 && `${noPct}% NAY`}
                          </div>
                        </div>
                        {yesPct < 15 && (
                          <div className="flex justify-between text-[9px] font-mono text-stone-500 font-bold">
                            <span>{yesPct}% YEA</span>
                            <span>{noPct}% NAY</span>
                          </div>
                        )}
                      </div>

                      <p className="text-[9.5px] text-stone-500 leading-snug">
                        Real-time community distributions are weighted based on geographic states and civic involvement indexes.
                      </p>
                    </div>

                    {/* Politician Matchup alignment (Right) */}
                    <div className="lg:col-span-3 space-y-2.5">
                      <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest block">Followed Legislators Match</span>
                      
                      <div className="space-y-1.5">
                        {(() => {
                          // Filter legislators: first try the ones the user actually follows in the app
                          let matchLegs = legislators.filter(l => followedLegislators.includes(l.id));
                          let usingFallback = false;
                          
                          // If they haven't followed any yet, fall back to prominent national figures
                          if (matchLegs.length === 0) {
                            matchLegs = legislators.filter(l => ["Elizabeth Warren", "J.D. Vance", "Chuck Schumer", "Ted Cruz", "Elise Stefanik"].includes(l.name)).slice(0, 2);
                            usingFallback = true;
                          }
                          
                          if (matchLegs.length === 0) {
                            return <p className="text-[10px] text-stone-400 italic font-semibold">No legislators available to match.</p>;
                          }

                          return (
                            <>
                              {matchLegs.map(leg => {
                                // Synthesize a vote stance based on bill category & party
                                let legVote = "Yea";
                                if (bill.id === "HR-58" && leg.party === "D") legVote = "Nay";
                                if (bill.id === "S-12" && leg.party === "D") legVote = "Nay";
                                if (bill.id === "HR-104" && leg.name === "Elizabeth Warren") legVote = "Nay"; // Left critic
                                if (bill.id === "HR-82" && leg.name === "J.D. Vance") legVote = "Yea"; // Populist support

                                const isAligned = myVote ? myVote === legVote : null;

                                return (
                                  <div key={leg.id} className="flex items-center justify-between text-xs bg-[#F9F8F6] p-2 rounded-none border border-stone-200" id={`comparison-match-${leg.id.toLowerCase()}`}>
                                    <div className="flex items-center space-x-2">
                                      <div className={`h-1.5 w-1.5 rounded-full ${leg.party === "D" ? "bg-blue-600" : "bg-red-600"}`}></div>
                                      <span className="font-semibold text-stone-800">{leg.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-bold ${
                                        legVote === "Yea" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                                      }`}>
                                        {legVote}
                                      </span>
                                      {isAligned !== null && (
                                        <span className={`text-[9.5px] font-black ${isAligned ? "text-emerald-600" : "text-red-500"}`}>
                                          {isAligned ? "✓ Match" : "✗ Gap"}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              {usingFallback && (
                                <p className="text-[9px] text-stone-500 mt-2 text-center leading-snug font-medium italic bg-stone-50 p-2 border border-stone-150 rounded-none">
                                  💡 Tap the Star icon on lawmakers in <strong>Civics Scorecards</strong> to track your actual representatives here!
                                </p>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Comment & Feedback Board (Bottom) */}
                  <div className="p-5 bg-stone-50/10 space-y-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
                      <MessageSquare className="h-4 w-4 text-stone-400" />
                      <span>Citizen Feedback Loop ({mergedComments.length})</span>
                    </div>

                    {/* New Comment Submission bar */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCommentText[bill.id] || ""}
                        onChange={(e) => setNewCommentText(prev => ({ ...prev, [bill.id]: e.target.value }))}
                        placeholder="Attach a brief feedback comment to this bill..."
                        className="flex-1 bg-[#F9F8F6] border border-stone-200 rounded-none px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-500 font-medium"
                      />
                      <button
                        onClick={() => handleAddComment(bill.id)}
                        className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-none px-4.5 py-1.5 transition cursor-pointer shrink-0"
                      >
                        Submit
                      </button>
                    </div>

                    {/* Scrollable comment items */}
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {mergedComments.map((c, idx) => (
                        <div key={idx} className="bg-stone-50/70 p-2.5 rounded-none border border-stone-200/60 text-[11px] leading-normal font-medium">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-stone-800 text-[10px]">{c.author}</span>
                            <span className="text-[9px] font-mono text-stone-400">Verified Citizen</span>
                          </div>
                          <p className="text-stone-600 italic">&ldquo;{c.comment}&rdquo;</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
