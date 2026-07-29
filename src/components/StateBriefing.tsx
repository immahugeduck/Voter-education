import React, { useState, useEffect } from "react";
import { 
  Map, 
  Compass,
  TrendingUp, 
  Scale, 
  Target, 
  ShieldCheck, 
  AlertCircle, 
  Users, 
  HelpCircle, 
  Search, 
  Activity, 
  Info,
  ChevronRight,
  ArrowUpRight,
  Award,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  MapPin,
  ChevronLeft,
  User,
  Percent,
  BookOpen,
  Clock,
  Layers,
  Database,
  Building2,
  Star,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { LegislatorScorecard } from "../types";

interface StateAlignmentData {
  stateCode: string;
  stateName: string;
  caiScore: number; // Constituent Alignment Index (0-100)
  primaryInterests: { category: string; percentage: number; icon: string }[];
  constituentStance: { billId: string; stance: "Yea" | "Nay"; issue: string; agreementRate: number }[];
  localSampleQuote: { text: string; author: string; city: string };
}

interface StateBriefingProps {
  followedLegislators: string[];
  toggleFollowLegislator: (id: string) => void;
  selectedLocalState: string;
  onStateChange: (stateCode: string) => void;
}

// 50 US States grid layout positions for interactive map
const STATE_GRID: { code: string; col: number; row: number }[] = [
  { code: "AK", col: 0, row: 0 },
  { code: "ME", col: 11, row: 0 },
  { code: "WA", col: 1, row: 1 },
  { code: "ID", col: 2, row: 1 },
  { code: "MT", col: 3, row: 1 },
  { code: "ND", col: 4, row: 1 },
  { code: "MN", col: 5, row: 1 },
  { code: "WI", col: 6, row: 1 },
  { code: "MI", col: 8, row: 1 },
  { code: "NY", col: 9, row: 1 },
  { code: "VT", col: 10, row: 1 },
  { code: "NH", col: 11, row: 1 },
  { code: "OR", col: 1, row: 2 },
  { code: "NV", col: 2, row: 2 },
  { code: "WY", col: 3, row: 2 },
  { code: "SD", col: 4, row: 2 },
  { code: "IA", col: 5, row: 2 },
  { code: "IL", col: 6, row: 2 },
  { code: "IN", col: 7, row: 2 },
  { code: "OH", col: 8, row: 2 },
  { code: "PA", col: 9, row: 2 },
  { code: "NJ", col: 10, row: 2 },
  { code: "MA", col: 11, row: 2 },
  { code: "CA", col: 0, row: 3 },
  { code: "UT", col: 2, row: 3 },
  { code: "CO", col: 3, row: 3 },
  { code: "NE", col: 4, row: 3 },
  { code: "MO", col: 5, row: 3 },
  { code: "KY", col: 6, row: 3 },
  { code: "WV", col: 7, row: 3 },
  { code: "VA", col: 8, row: 3 },
  { code: "MD", col: 9, row: 3 },
  { code: "DE", col: 10, row: 3 },
  { code: "RI", col: 11, row: 3 },
  { code: "AZ", col: 2, row: 4 },
  { code: "NM", col: 3, row: 4 },
  { code: "KS", col: 4, row: 4 },
  { code: "AR", col: 5, row: 4 },
  { code: "TN", col: 6, row: 4 },
  { code: "NC", col: 7, row: 4 },
  { code: "SC", col: 8, row: 4 },
  { code: "CT", col: 11, row: 4 },
  { code: "OK", col: 4, row: 5 },
  { code: "TX", col: 5, row: 5 },
  { code: "LA", col: 6, row: 5 },
  { code: "MS", col: 7, row: 5 },
  { code: "AL", col: 8, row: 5 },
  { code: "GA", col: 9, row: 5 },
  { code: "FL", col: 10, row: 5 },
  { code: "HI", col: 0, row: 6 }
];

const SEED_STATE_PROFILES: Record<string, StateAlignmentData> = {
  CA: {
    stateCode: "CA",
    stateName: "California",
    caiScore: 82,
    primaryInterests: [
      { category: "Technology & Privacy", percentage: 40, icon: "🛡️" },
      { category: "Housing & Economy", percentage: 35, icon: "🏠" },
      { category: "Energy & Climate", percentage: 25, icon: "⚡" }
    ],
    constituentStance: [
      { billId: "HR-104", stance: "Nay", issue: "AI Licensing Schemes", agreementRate: 85 },
      { billId: "S-12", stance: "Yea", issue: "First Amendment Digital Speech", agreementRate: 78 },
      { billId: "HR-82", stance: "Yea", issue: "Middle-Class Housing Credits", agreementRate: 91 }
    ],
    localSampleQuote: {
      text: "Silicon Valley startups are being crushed by heavy licensing overhead, while our rent prices remain impossible. We need structural regulatory reform.",
      author: "Marcus V.",
      city: "Palo Alto"
    }
  },
  TX: {
    stateCode: "TX",
    stateName: "Texas",
    caiScore: 54,
    primaryInterests: [
      { category: "Energy Independence", percentage: 45, icon: "⚡" },
      { category: "Financial Privacy", percentage: 35, icon: "🪙" },
      { category: "Housing & Development", percentage: 20, icon: "🏠" }
    ],
    constituentStance: [
      { billId: "S-41", stance: "Yea", issue: "Grid Modernization & Sovereign Energy", agreementRate: 92 },
      { billId: "HR-58", stance: "Yea", issue: "Anti-CBDC Financial Protection", agreementRate: 88 },
      { billId: "HR-82", stance: "Yea", issue: "Zoning Deregulation", agreementRate: 74 }
    ],
    localSampleQuote: {
      text: "Securing our power grid is an absolute priority after recent outages, but we must protect our cash options and refuse federal digital tracking.",
      author: "Evelyn R.",
      city: "Dallas"
    }
  },
  NY: {
    stateCode: "NY",
    stateName: "New York",
    caiScore: 76,
    primaryInterests: [
      { category: "Housing & Middle-Class Relief", percentage: 42, icon: "🏠" },
      { category: "Financial Services", percentage: 33, icon: "📈" },
      { category: "Technology & AI Safety", percentage: 25, icon: "🛡️" }
    ],
    constituentStance: [
      { billId: "HR-82", stance: "Yea", issue: "Middle-Class Housing Credits", agreementRate: 89 },
      { billId: "HR-58", stance: "Nay", issue: "Central Bank Digital Currency restriction", agreementRate: 64 },
      { billId: "S-12", stance: "Yea", issue: "First Amendment Speech Accord", agreementRate: 72 }
    ],
    localSampleQuote: {
      text: "We need state-level zoning overrides. City boards block dense housing, creating a synthetic crisis that locks out younger working families.",
      author: "Julian K.",
      city: "Brooklyn"
    }
  },
  MA: {
    stateCode: "MA",
    stateName: "Massachusetts",
    caiScore: 89,
    primaryInterests: [
      { category: "Academic Research & AI", percentage: 45, icon: "🛡️" },
      { category: "Housing construction", percentage: 30, icon: "🏠" },
      { category: "Clean Grid Modernization", percentage: 25, icon: "⚡" }
    ],
    constituentStance: [
      { billId: "HR-104", stance: "Nay", issue: "AI Licensing Safeguards", agreementRate: 81 },
      { billId: "S-41", stance: "Yea", issue: "Electrical Grid Investment", agreementRate: 87 },
      { billId: "HR-82", stance: "Yea", issue: "Affordable Housing credits", agreementRate: 94 }
    ],
    localSampleQuote: {
      text: "Open academic computing hubs will save independent AI research from big tech monopolies. Massachusetts' universities need direct access.",
      author: "Dr. Clara L.",
      city: "Cambridge"
    }
  },
  OH: {
    stateCode: "OH",
    stateName: "Ohio",
    caiScore: 68,
    primaryInterests: [
      { category: "Domestic Manufacturing", percentage: 40, icon: "🏭" },
      { category: "Energy Independence", percentage: 35, icon: "⚡" },
      { category: "Lower Tax Codes", percentage: 25, icon: "📉" }
    ],
    constituentStance: [
      { billId: "S-41", stance: "Yea", issue: "Critical Mineral Refineries", agreementRate: 90 },
      { billId: "HR-82", stance: "Yea", issue: "Middle-Class Housing Tax relief", agreementRate: 79 },
      { billId: "HR-58", stance: "Yea", issue: "Constitutional Financial Freedom", agreementRate: 84 }
    ],
    localSampleQuote: {
      text: "Sovereign mining limits are a major security hole. Building lithium refineries right here in the Rust Belt brings back high-wage skilled careers.",
      author: "Greg M.",
      city: "Akron"
    }
  }
};

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

function generateStateProfile(stateCode: string): StateAlignmentData {
  if (SEED_STATE_PROFILES[stateCode]) {
    return SEED_STATE_PROFILES[stateCode];
  }

  const charSum = stateCode.charCodeAt(0) + stateCode.charCodeAt(1);
  const caiScore = 45 + (charSum % 46); // Stable score between 45 and 91
  
  const categories = [
    "Housing & Economy",
    "Energy Independence",
    "Civil Liberties",
    "Technology & AI Safety",
    "Constitutional Privacy",
    "Domestic Manufacturing"
  ];
  const idx1 = charSum % categories.length;
  const idx2 = (charSum + 2) % categories.length;
  const idx3 = (charSum + 4) % categories.length;

  const cat1 = categories[idx1];
  const cat2 = categories[idx2] !== cat1 ? categories[idx2] : categories[(idx2 + 1) % categories.length];
  const cat3 = (categories[idx3] !== cat1 && categories[idx3] !== cat2) ? categories[idx3] : categories[(idx3 + 1) % categories.length];

  return {
    stateCode,
    stateName: STATE_NAMES[stateCode] || stateCode,
    caiScore,
    primaryInterests: [
      { category: cat1, percentage: 45, icon: "⚡" },
      { category: cat2, percentage: 35, icon: "🏠" },
      { category: cat3, percentage: 20, icon: "🛡️" }
    ],
    constituentStance: [
      { billId: "S-41", stance: charSum % 2 === 0 ? "Yea" : "Nay", issue: "Grid Modernization & Energy", agreementRate: 70 + (charSum % 25) },
      { billId: "HR-82", stance: "Yea", issue: "Middle-Class Housing Credits", agreementRate: 75 + (charSum % 20) },
      { billId: "HR-58", stance: charSum % 3 === 0 ? "Yea" : "Nay", issue: "Anti-CBDC Financial Protection", agreementRate: 65 + (charSum % 25) }
    ],
    localSampleQuote: {
      text: `Constituents here are highly focused on stable utility grid networks and ensuring localized cost-of-living inflation is addressed with direct tax Relief.`,
      author: "Citizen Correspondent",
      city: "Capital District"
    }
  };
}

const QUIZ_BILLS = [
  {
    id: "HR-82",
    title: "Affordable Housing Construction & Tax Relief Act",
    category: "Housing & Economy",
    description: "Stimulates middle-class multi-family housing development via targeted federal tax credits and regulatory streamlining.",
    pros: [
      "Lowers entry barriers for first-time homebuyers with state grants",
      "Expands the Low-Income Housing Tax Credit (LIHTC) to incentivize builders"
    ],
    cons: [
      "Increases short-term federal deficit by an estimated $12 billion",
      "May override local municipal zoning autonomy in suburban regions"
    ],
    demStance: "Yea",
    repStance: "Yea"
  },
  {
    id: "S-41",
    title: "Grid Modernization & Sovereign Energy Initiative",
    category: "Energy & Security",
    description: "Authorizes long-term investments to overhaul the US electrical grid and fast-tracks domestic critical mineral refineries.",
    pros: [
      "Upgrades vulnerable regional power networks against extreme weather",
      "Secures internal supplies of lithium and cobalt, reducing reliance on adversaries"
    ],
    cons: [
      "Permitting fast-tracks bypass traditional EPA environmental reviews",
      "Funds carbon capture programs that critics call greenwashing"
    ],
    demStance: "Yea",
    repStance: "Yea"
  },
  {
    id: "HR-104",
    title: "Sovereign AI Safety, Licensing & Supercomputing Act",
    category: "Technology",
    description: "Establishes a federal licensing matrix for foundation AI models above a specific compute threshold while funding national research labs.",
    pros: [
      "Creates mandatory liability framework for model-assisted biological synthesis or deepfakes",
      "Funds open-source supercomputer hubs for public academic research"
    ],
    cons: [
      "Heavily favors established tech oligopolies by raising licensing and compliance overhead",
      "Could stifle agility and grassroots development of local start-ups"
    ],
    demStance: "Yea",
    repStance: "Nay"
  },
  {
    id: "HR-58",
    title: "Constitutional Privacy & Financial Freedom Protection Act",
    category: "Civil Liberties & Finance",
    description: "Strictly forbids the Federal Reserve from deploying a Central Bank Digital Currency (CBDC) to monitor individual consumer transactions.",
    pros: [
      "Ensures the state cannot freeze citizen liquid assets or trace private cash equivalents",
      "Protects decentralized financial alternatives and local banking liquidity models"
    ],
    cons: [
      "Impedes federal modernization of faster cross-border settlements and anti-fraud systems",
      "Limits state capabilities to block digital dark-market operations or international ransom networks"
    ],
    demStance: "Nay",
    repStance: "Yea"
  },
  {
    id: "S-12",
    title: "First Amendment Digital Speech & Transparency Accord",
    category: "Civil Liberties",
    description: "Prevents executive agencies from pressuring social platforms to moderate or restrict non-illegal political discourse.",
    pros: [
      "Stops quiet governmental coordination to flag, shadowban, or throttle alternative opinions",
      "Establishes a transparent public appeal registry for any user content removal"
    ],
    cons: [
      "Severely hampers collaborative federal efforts to warning-label foreign intelligence cyber operations",
      "May allow unchecked viral spreading of emergency medical misinformation during public health crises"
    ],
    demStance: "Nay",
    repStance: "Yea"
  }
];

const SIGNIFICANT_BILLS = [
  {
    id: "S. 2058",
    title: "The Farm Bill Extension Directive",
    category: "Economy",
    desc: "Extends federal agricultural subsidies, supports community food nutrition safety-net rules, and provides financial relief to rural family co-ops.",
    dVote: "Yea",
    rVote: "Nay"
  },
  {
    id: "H.R. 3935",
    title: "Securing Growth in American Aviation Act",
    category: "Economy",
    desc: "Allocates federal funding for runway expansion and airport safety infrastructure, and enhances passenger refund protections.",
    dVote: "Yea",
    rVote: "Yea"
  },
  {
    id: "H.R. 6090",
    title: "Antisemitism Awareness Act",
    category: "Social/Civil Rights",
    desc: "Provides a standardized definition of antisemitism for the Department of Education to enforce civil rights laws on college campuses.",
    dVote: "Yea",
    rVote: "Yea"
  },
  {
    id: "H.R. 7024",
    title: "Tax Relief for American Families and Workers Act",
    category: "Economy",
    desc: "Expands the child tax credit, restores corporate research and development tax deductions, and boosts low-income housing credits.",
    dVote: "Yea",
    rVote: "Yea"
  },
  {
    id: "S. 3543",
    title: "Clean Energy Technology & Grid Modernization Pact",
    category: "Environment",
    desc: "Provides federal subsidies for offshore wind integration, modernizes interstate high-voltage electricity lines, and restricts coal extraction permits.",
    dVote: "Yea",
    rVote: "Nay"
  },
  {
    id: "S. 1104",
    title: "Lower Drug Costs Now Act",
    category: "Healthcare",
    desc: "Empowers Medicare to negotiate prices directly for senior prescription drugs and caps out-of-pocket insulin co-pays at $35 per month.",
    dVote: "Yea",
    rVote: "Nay"
  }
];

const getSimpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const getLegVoteOnBill = (leg: LegislatorScorecard, billId: string) => {
  const billHash = getSimpleHash(leg.id + billId);
  const isDem = leg.party === "D";
  
  switch (billId) {
    case "S. 2058":
      if (isDem) return { vote: "Yea", impact: "Supported agricultural safety net rules and community nutrition benefits." };
      return billHash % 3 === 0 
        ? { vote: "Yea", impact: "Crossed party guidelines to support key farm subsidies in their state." }
        : { vote: "Nay", impact: "Advocated for budget spending reductions, opposing subsidy extension hikes." };
    case "H.R. 3935":
      return billHash % 12 === 0
        ? { vote: "Nay", impact: "Opposed, citing excessive federal allocations over local state airport authorities." }
        : { vote: "Yea", impact: "Endorsed bipartisan funding for runway safety and airport modernization." };
    case "H.R. 6090":
      if (leg.party === "R") return { vote: "Yea", impact: "Supported enforcement of clear safety and reporting metrics on college campuses." };
      return billHash % 4 === 0
        ? { vote: "Nay", impact: "Opposed due to specific First Amendment and academic free expression concerns." }
        : { vote: "Yea", impact: "Voted to define standard campus reporting parameters for discrimination inquiries." };
    case "H.R. 7024":
      if (billHash % 10 === 0) return { vote: "Nay", impact: "Voted nay, citing concerns regarding structural budget deficit growth." };
      return { vote: "Yea", impact: "Supported the expansion of corporate research credits alongside family child tax benefits." };
    case "S. 3543":
      if (isDem) return billHash % 8 === 0 
        ? { vote: "Nay", impact: "Voted against, citing lack of adequate green hydrogen incentives." }
        : { vote: "Yea", impact: "Supported extensive investments in offshore wind and grid modernization technology." };
      return billHash % 7 === 0
        ? { vote: "Yea", impact: "Broke party consensus to support state carbon reduction manufacturing grants." }
        : { vote: "Nay", impact: "Voted nay, opposing federal intervention in conventional energy sectors." };
    case "S. 1104":
      if (isDem) return { vote: "Yea", impact: "Voted to cap senior out-of-pocket insulin co-pays and negotiate Medicare drug pricing." };
      return billHash % 5 === 0
        ? { vote: "Yea", impact: "Supported senior healthcare caps to aid elderly state residents." }
        : { vote: "Nay", impact: "Voted against pricing caps, favoring market-driven corporate competition." };
    default:
      return { vote: "Yea", impact: "Supported passage of the general legislative directive." };
  }
};

export default function StateBriefing({
  followedLegislators = [],
  toggleFollowLegislator,
  selectedLocalState,
  onStateChange
}: StateBriefingProps) {
  const [activeTab, setActiveTab] = useState<"map" | "legislators" | "rankings">("map");
  const [legislators, setLegislators] = useState<LegislatorScorecard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Map state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 24;

  const [hoveredState, setHoveredState] = useState<string | null>(null);

  // Scorecards state
  const [selectedLegId, setSelectedLegId] = useState<string>("");
  const [compareLegId, setCompareLegId] = useState<string>("");
  const [scorecardSearchTerm, setScorecardSearchTerm] = useState("");
  const [selectedChamber, setSelectedChamber] = useState<string>("ALL");
  const [selectedParty, setSelectedParty] = useState<string>("ALL");
  const [activeDetailsTab, setActiveDetailsTab] = useState<"scorecard" | "voting-analytics">("scorecard");

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, "Yea" | "Nay">>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);

  // Exact Civic Reps state
  const [exactAddress, setExactAddress] = useState("");
  const [civicReps, setCivicReps] = useState<any[]>([]);
  const [civicLoading, setCivicLoading] = useState(false);
  const [civicError, setCivicError] = useState<string | null>(null);

  const fetchExactReps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exactAddress.trim()) return;
    setCivicLoading(true);
    setCivicError(null);
    try {
      const resp = await fetch(`/api/civic/reps?address=${encodeURIComponent(exactAddress)}`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed to fetch exact representatives.");
      
      const officials: any[] = [];
      if (data.offices && data.officials) {
         data.offices.forEach((office: any) => {
           if (office.officialIndices) {
             office.officialIndices.forEach((idx: number) => {
               const official = data.officials[idx];
               officials.push({
                 officeName: office.name,
                 ...official
               });
             });
           }
         });
      }
      setCivicReps(officials);
    } catch (err: any) {
      setCivicError(err.message);
    } finally {
      setCivicLoading(false);
    }
  };

  // Fetch legislators once
  useEffect(() => {
    async function fetchLegislators() {
      try {
        setLoading(true);
        const res = await fetch("/api/legislation/legislators");
        const json = await res.json();
        const data = json.data || [];
        setLegislators(data);
        if (data.length > 0) {
          // Default selection to first politician of user's active state, or fallback first item
          const stateLegs = data.filter((l: any) => l.state.toUpperCase() === selectedLocalState.toUpperCase());
          if (stateLegs.length > 0) {
            setSelectedLegId(stateLegs[0].id);
          } else {
            setSelectedLegId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load legislators for State Briefing:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLegislators();
  }, []);

  // Update pre-selected senator if the selectedLocalState changes
  useEffect(() => {
    if (legislators.length > 0) {
      const stateLegs = legislators.filter((l) => l.state.toUpperCase() === selectedLocalState.toUpperCase());
      if (stateLegs.length > 0) {
        // Only override if not already looking at a state legislator
        const currentLeg = legislators.find(l => l.id === selectedLegId);
        if (!currentLeg || currentLeg.state !== selectedLocalState) {
          setSelectedLegId(stateLegs[0].id);
        }
      }
    }
  }, [selectedLocalState, legislators]);

  const activeProfile = generateStateProfile(selectedLocalState);

  // State delegation list
  const stateDelegation = legislators.filter(
    (l) => l.state.toUpperCase() === selectedLocalState.toUpperCase()
  );

  // Filtered legislators list for the scorecard panel
  const filteredLegislators = legislators.filter((leg) => {
    const matchesSearch = leg.name.toLowerCase().includes(scorecardSearchTerm.toLowerCase());
    const matchesState = selectedLocalState === "ALL" || leg.state === selectedLocalState;
    const matchesChamber = selectedChamber === "ALL" || leg.chamber === selectedChamber;
    const matchesParty = selectedParty === "ALL" || leg.party === selectedParty;
    return matchesSearch && matchesState && matchesChamber && matchesParty;
  });

  const totalPages = Math.ceil(filteredLegislators.length / itemsPerPage);
  const currentLegislators = filteredLegislators.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [scorecardSearchTerm, selectedLocalState, selectedChamber, selectedParty]);

  const selectedLeg = legislators.find((l) => l.id === selectedLegId);
  const compareLeg = legislators.find((l) => l.id === compareLegId);

  // Quiz methods
  const handleAnswer = (billId: string, answer: "Yea" | "Nay") => {
    setQuizAnswers(prev => ({ ...prev, [billId]: answer }));
    if (currentQuestionIndex < QUIZ_BILLS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const resetQuiz = () => {
    setQuizAnswers({});
    setCurrentQuestionIndex(0);
    setQuizCompleted(false);
  };

  const calculatePersonalAlignment = () => {
    const answeredKeys = Object.keys(quizAnswers);
    if (answeredKeys.length === 0) return { overall: 0, dem: 0, rep: 0, legislatorsMatch: [] };

    let totalMatchesWithState = 0;
    let demMatches = 0;
    let repMatches = 0;

    answeredKeys.forEach(id => {
      const bill = QUIZ_BILLS.find(b => b.id === id);
      if (!bill) return;

      const userAns = quizAnswers[id];
      if (userAns === bill.demStance) demMatches++;
      if (userAns === bill.repStance) repMatches++;

      const stateStance = activeProfile.constituentStance.find(s => s.billId === id);
      if (stateStance && userAns === stateStance.stance) {
        totalMatchesWithState++;
      }
    });

    const overallScore = Math.round((totalMatchesWithState / answeredKeys.length) * 100);
    const demScore = Math.round((demMatches / answeredKeys.length) * 100);
    const repScore = Math.round((repMatches / answeredKeys.length) * 100);

    const legislatorsMatch = stateDelegation.map(leg => {
      let score = 0;
      let matchedCount = 0;

      answeredKeys.forEach(id => {
        const bill = QUIZ_BILLS.find(b => b.id === id);
        if (!bill) return;

        const userAns = quizAnswers[id];
        let legVote = leg.party === "D" ? bill.demStance : bill.repStance;

        //Elizabeth Warren override
        if (id === "HR-104" && leg.name === "Elizabeth Warren") legVote = "Nay";
        if (id === "HR-82" && leg.name === "J.D. Vance") legVote = "Yea";

        if (userAns === legVote) {
          score++;
        }
        matchedCount++;
      });

      const pct = matchedCount > 0 ? Math.round((score / matchedCount) * 100) : 0;

      return {
        legislator: leg,
        matchPercentage: pct
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);

    return {
      overall: overallScore,
      dem: demScore,
      rep: repScore,
      legislatorsMatch
    };
  };

  const quizResult = calculatePersonalAlignment();

  // Sort states by CAI Score to show "Worst Aligned State delegations" or "Best Aligned"
  const getSortedStateRankings = () => {
    return Object.keys(STATE_NAMES).map(code => {
      const prof = generateStateProfile(code);
      // Worst or best alignment can also consider delegation grades
      const delegation = legislators.filter(l => l.state === code);
      const avgLibertyIndex = delegation.length > 0
        ? Math.round(delegation.reduce((acc, curr) => acc + (curr.libertyProsperityIndex?.overallScore || 50), 0) / delegation.length)
        : 60;
      return {
        code,
        name: STATE_NAMES[code],
        caiScore: prof.caiScore,
        avgLibertyIndex,
        delegationCount: delegation.length
      };
    }).sort((a, b) => a.caiScore - b.caiScore); // low scores first (worst representatives alignment first)
  };

  const stateRankings = getSortedStateRankings();

  // Render US Grid Map helper
  const rows = Array.from({ length: 7 }, (_, i) => i);
  const cols = Array.from({ length: 12 }, (_, i) => i);

  const getCaiColorClass = (score: number) => {
    if (score >= 80) return "bg-emerald-600 text-white hover:bg-emerald-500 border-emerald-700";
    if (score >= 70) return "bg-emerald-500/80 text-white hover:bg-emerald-500 border-emerald-600";
    if (score >= 60) return "bg-amber-500/80 text-stone-900 hover:bg-amber-500 border-amber-600";
    if (score >= 50) return "bg-amber-600 text-white hover:bg-amber-500 border-amber-700";
    return "bg-rose-600 text-white hover:bg-rose-500 border-rose-700";
  };

  const getCaiBgHex = (score: number) => {
    if (score >= 80) return "#059669"; // Emerald 600
    if (score >= 70) return "#10b981"; // Emerald 500
    if (score >= 60) return "#f59e0b"; // Amber 500
    if (score >= 50) return "#d97706"; // Amber 600
    return "#dc2626"; // Rose 600
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Hero Banner */}
      <div className="bg-stone-900 text-white rounded-none border border-stone-800 p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Map className="h-32 w-32" />
        </div>
        <div className="relative max-w-2xl space-y-2">
          <h2 className="text-xl font-display font-black text-stone-100 flex items-center gap-2">
            <Map className="h-5 w-5 text-amber-500" />
            State Civics & Briefing Hub
          </h2>
          <p className="text-stone-400 text-xs leading-relaxed">
            Analyze standard Constituent Alignment Indexes (CAI) across all 50 states, examine detailed representative grades, and check where they diverge from local citizen consensus polling. Your active state is loaded automatically below.
          </p>
        </div>
      </div>

      {/* 2. State-wide location indicator bar with quick-switch selector */}
      <div className="p-4 bg-[#F9F8F6] border border-stone-200 rounded-none shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-stone-100 text-amber-600 rounded-none border border-stone-200">
            <MapPin className="h-5 w-5 animate-bounce" />
          </div>
          <div>
            <span className="text-[9.5px] font-mono font-bold text-stone-400 uppercase tracking-wider block">Currently Detected Region</span>
            <span className="text-base font-bold text-stone-900">
              {STATE_NAMES[selectedLocalState] || selectedLocalState} ({selectedLocalState})
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <label className="text-xs font-semibold text-stone-500 whitespace-nowrap">Switch State Briefing:</label>
          <select
            value={selectedLocalState}
            onChange={(e) => onStateChange(e.target.value)}
            className="flex-1 md:w-48 bg-stone-50 border border-stone-200 hover:border-stone-350 focus:outline-none rounded-none px-3 py-2 text-xs font-bold text-stone-800 cursor-pointer shadow-xs transition"
          >
            {Object.keys(STATE_NAMES).map((code) => (
              <option key={code} value={code}>
                {STATE_NAMES[code]} ({code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Subview Navigation Tabs */}
      <div className="flex bg-stone-100 p-1 rounded-none border border-stone-200 shadow-sm gap-1">
        <button
          onClick={() => setActiveTab("map")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-none transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "map"
              ? "bg-stone-900 text-amber-500 shadow-sm"
              : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
          }`}
        >
          <Map className="h-4 w-4" />
          Interactive State Map
        </button>

        <button
          onClick={() => setActiveTab("legislators")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-none transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "legislators"
              ? "bg-stone-900 text-amber-500 shadow-sm"
              : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
          }`}
        >
          <Award className="h-4 w-4" />
          Senator & Rep Scorecards
        </button>

        <button
          onClick={() => setActiveTab("rankings")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-none transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "rankings"
              ? "bg-stone-900 text-amber-500 shadow-sm"
              : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
          }`}
        >
          <Scale className="h-4 w-4" />
          Divergence Rankings & Quiz
        </button>
      </div>

      {/* 4. Subview Content Panels */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3 bg-[#F9F8F6] border border-stone-200 rounded-none shadow-sm">
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
          <span className="text-xs font-mono text-stone-500">Compiling 50-state dynamic scores database...</span>
        </div>
      ) : (
        <div className="animate-fade-in" id="state-briefing-views">
          
          {/* TAB 1: INTERACTIVE STATE MAP */}
          {activeTab === "map" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Map Column */}
              <div className="lg:col-span-8 bg-[#F9F8F6] p-5 rounded-none border border-stone-200 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3 gap-2">
                  <div className="space-y-1">
                    <h3 className="text-sm font-sans font-extrabold text-stone-900">Interactive US Grid Map</h3>
                    <p className="text-xs text-stone-500">Color matches CAI score: High scores (emerald) mean senators vote in lockstep with citizens.</p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-stone-500 self-start sm:self-center">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-600 inline-block"></span> High Alignment (80+)</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500 inline-block"></span> Moderate (60+)</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-600 inline-block"></span> Low Alignment (&lt;50)</span>
                  </div>
                </div>

                {/* 50-State Grid View */}
                <div className="relative overflow-x-auto select-none pt-2 scrollbar-none">
                  <div className="grid grid-cols-12 gap-1.5 md:gap-2.5 min-w-[540px] p-2 bg-stone-900 rounded-none border border-stone-950">
                    {rows.map((r) =>
                      cols.map((c) => {
                        const cell = STATE_GRID.find((g) => g.col === c && g.row === r);
                        if (!cell) {
                          return <div key={`empty-${r}-${c}`} className="aspect-square opacity-0"></div>;
                        }

                        const cellProfile = generateStateProfile(cell.code);
                        const isSelected = selectedLocalState.toUpperCase() === cell.code.toUpperCase();
                        const isHovered = hoveredState === cell.code;

                        return (
                          <button
                            key={cell.code}
                            onMouseEnter={() => setHoveredState(cell.code)}
                            onMouseLeave={() => setHoveredState(null)}
                            onClick={() => {
                              onStateChange(cell.code);
                              setActiveTab("legislators");
                            }}
                            style={{
                              backgroundColor: isSelected ? "#ffffff" : getCaiBgHex(cellProfile.caiScore),
                              color: isSelected ? "#1e293b" : "#ffffff"
                            }}
                            className={`aspect-square rounded-none flex flex-col items-center justify-center border transition-all cursor-pointer relative ${
                              isSelected
                                ? "scale-110 shadow-lg border-white font-black z-10"
                                : "hover:scale-105 hover:shadow-md border-transparent hover:border-white/50"
                            }`}
                          >
                            <span className="text-[11px] md:text-sm font-sans font-black tracking-tight">{cell.code}</span>
                            <span className={`text-[8px] md:text-[9px] font-mono mt-0.5 ${isSelected ? "text-stone-600" : "text-white/80"}`}>
                              {cellProfile.caiScore}
                            </span>

                            {/* Hover tooltip */}
                            {isHovered && !isSelected && (
                              <div className="absolute bottom-full mb-2 bg-stone-950 text-white border border-stone-800 text-[10px] p-2 rounded-none shadow-xl font-bold whitespace-nowrap z-50 pointer-events-none">
                                {STATE_NAMES[cell.code]} • CAI: {cellProfile.caiScore}%
                              </div>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Active State Profile Card details */}
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-none space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Compass className="h-4.5 w-4.5 text-amber-600" />
                      <h4 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest">
                        {STATE_NAMES[selectedLocalState]} Constituent Profile
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded border border-amber-500/15">
                      CONSTITUENT ALIGNMENT INDEX: {activeProfile.caiScore}/100
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Key constituent categories */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block">Top Primary Interests</span>
                      <div className="space-y-2">
                        {activeProfile.primaryInterests.map((interest, idx) => (
                          <div key={idx} className="p-2.5 bg-[#F9F8F6] border border-stone-150 rounded-none flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-base">{interest.icon}</span>
                              <span className="text-xs font-bold text-stone-800">{interest.category}</span>
                            </div>
                            <span className="text-xs font-mono text-stone-500 font-semibold">{interest.percentage}% weight</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Local public quote */}
                    <div className="p-4 bg-[#F9F8F6] border border-stone-150 rounded-none flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block">Citizen Pulse Survey Quote</span>
                        <p className="text-xs text-stone-650 italic leading-relaxed">
                          &ldquo;{activeProfile.localSampleQuote.text}&rdquo;
                        </p>
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono mt-3 text-right">
                        — {activeProfile.localSampleQuote.author}, {activeProfile.localSampleQuote.city}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* State delegation list right sidebar */}
              <div className="lg:col-span-4 bg-[#F9F8F6] p-5 rounded-none border border-stone-200 shadow-sm space-y-5">
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-bold tracking-widest text-stone-400 uppercase flex items-center gap-1">
                    <Users className="h-4 w-4 text-amber-500" /> Exact Civic Representatives
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Enter your street address to find the exact federal and state officials passing laws that affect you, powered by Google Civic Information.
                  </p>
                </div>
                
                <form onSubmit={fetchExactReps} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={exactAddress}
                      onChange={(e) => setExactAddress(e.target.value)}
                      placeholder="e.g. 1600 Pennsylvania Ave NW"
                      className="flex-1 bg-stone-50 border border-stone-200 rounded-none px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      disabled={civicLoading || !exactAddress.trim()}
                      className="bg-stone-900 text-white px-3 py-1.5 text-xs font-bold rounded-none hover:bg-stone-800 disabled:opacity-50"
                    >
                      {civicLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lookup"}
                    </button>
                  </div>
                  {civicError && <p className="text-[10px] text-red-600 font-bold">{civicError}</p>}
                </form>

                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {civicReps.length > 0 ? (
                    civicReps.map((rep, idx) => {
                      const isFed = rep.officeName.toLowerCase().includes("united states") || rep.officeName.toLowerCase().includes("u.s.");
                      const isD = rep.party?.includes("Democrat");
                      const isR = rep.party?.includes("Republican");
                      
                      // Calculate divergence against state consensus mock
                      let divergence = 0;
                      if (isD) divergence = 100 - activeProfile.caiScore; 
                      else if (isR) divergence = Math.abs(activeProfile.caiScore - 30);
                      else divergence = 40; // independent

                      if (divergence < 0) divergence = 0;
                      if (divergence > 100) divergence = 100;

                      return (
                        <div key={idx} className={`p-3 bg-stone-50 border ${isFed ? 'border-amber-500/30 bg-amber-50/10' : 'border-stone-200'} rounded-none space-y-2.5`}>
                          <div className="flex items-start gap-3">
                            {rep.photoUrl ? (
                              <img src={rep.photoUrl} alt={rep.name} referrerPolicy="no-referrer" className="h-10 w-10 rounded-full object-cover border border-stone-200 bg-[#F9F8F6]" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold text-stone-500">{rep.name[0]}</div>
                            )}
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-stone-950 block truncate">{rep.name}</span>
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block ${
                                isD ? "bg-blue-50 text-blue-700" : (isR ? "bg-red-50 text-red-700" : "bg-stone-100 text-stone-700")
                              }`}>
                                {rep.party || "Unknown"} • {rep.officeName}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-mono border-t border-stone-200/60 pt-2 text-stone-500">
                            <span className="flex items-center gap-1">Divergence Index: 
                              <span className={`font-extrabold px-1 py-0.5 rounded ${divergence > 50 ? 'text-red-700 bg-red-50' : 'text-emerald-700 bg-emerald-50'}`}>
                                {Math.round(divergence)}%
                              </span>
                            </span>
                          </div>
                          
                          {rep.urls && rep.urls.length > 0 && (
                            <a href={rep.urls[0]} target="_blank" rel="noreferrer" className="text-[9px] font-bold text-blue-600 hover:underline block mt-1">Official Website ↗</a>
                          )}
                        </div>
                      )
                    })
                  ) : stateDelegation.length === 0 ? (
                    <p className="text-xs text-stone-400 italic">No representative data parsed for this state yet.</p>
                  ) : (
                    stateDelegation.map((leg) => {
                      const isFollowed = followedLegislators.includes(leg.id);
                      return (
                        <div key={leg.id} className="p-3 bg-stone-50 border border-stone-200 rounded-none space-y-2.5">
                          <div className="flex items-center gap-3">
                            {leg.imageUrl ? (
                              <img src={leg.imageUrl} alt={leg.name} referrerPolicy="no-referrer" className="h-10 w-10 rounded-full object-cover border border-stone-200 bg-[#F9F8F6]" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold text-stone-500">{leg.name[0]}</div>
                            )}
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-stone-950 block truncate">{leg.name}</span>
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block ${
                                leg.party === "D" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"
                              }`}>
                                {leg.party}-{leg.state} • {leg.chamber}
                              </span>
                            </div>
                            <button
                              onClick={() => toggleFollowLegislator(leg.id)}
                              className={`p-1.5 rounded-none border cursor-pointer ${
                                isFollowed ? "bg-amber-500/15 border-amber-500/35 text-amber-600" : "bg-[#F9F8F6] border-stone-200 text-stone-400 hover:text-stone-650"
                              }`}
                            >
                              <Star className={`h-3.5 w-3.5 ${isFollowed ? "fill-amber-500" : ""}`} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-mono border-t border-stone-200/60 pt-2 text-stone-500">
                            <span>Attendance: <span className="font-bold text-stone-800">{leg.attendanceRate}%</span></span>
                            {leg.libertyProsperityIndex && (
                              <span className="flex items-center gap-1">Liberty Grade: <span className="font-extrabold text-amber-700 bg-amber-500/10 px-1 py-0.5 rounded">{leg.libertyProsperityIndex.grade}</span></span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <button
                  onClick={() => setActiveTab("legislators")}
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-2.5 rounded-none text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>Examine Detailed Scorecards</span>
                  <ChevronRight className="h-3.5 w-3.5 text-amber-500" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SENATOR SCORECARDS */}
          {activeTab === "legislators" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Filter Sidebar & Politician selection Roster (4 columns) */}
              <div className="lg:col-span-4 bg-[#F9F8F6] p-5 rounded-none border border-stone-200 shadow-sm space-y-5">
                <div className="space-y-1">
                  <h3 className="text-xs font-mono font-bold tracking-widest text-stone-400 uppercase flex items-center gap-1.5">
                    <Search className="h-4 w-4 text-amber-500" /> Search State Roster
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Filter delegation members for {STATE_NAMES[selectedLocalState]}:
                  </p>
                </div>

                {/* Scorecards Local State Filter Controls */}
                <div className="space-y-3.5">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Search member name..."
                      value={scorecardSearchTerm}
                      onChange={(e) => setScorecardSearchTerm(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-none pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-stone-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-stone-400 font-bold block mb-1">Chamber:</label>
                      <select
                        value={selectedChamber}
                        onChange={(e) => setSelectedChamber(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-none p-1.5 text-[11px] font-bold text-stone-700 focus:outline-none"
                      >
                        <option value="ALL">All Chambers</option>
                        <option value="Senate">Senate</option>
                        <option value="House">House</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-stone-400 font-bold block mb-1">Party:</label>
                      <select
                        value={selectedParty}
                        onChange={(e) => setSelectedParty(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-none p-1.5 text-[11px] font-bold text-stone-700 focus:outline-none"
                      >
                        <option value="ALL">All Parties</option>
                        <option value="D">Democrat</option>
                        <option value="R">Republican</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Filtered Scroll Roster List */}
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {currentLegislators.length === 0 ? (
                    <div className="text-xs text-stone-400 italic text-center py-10">No lawmakers match your criteria. Try changing filters or state.</div>
                  ) : (
                    currentLegislators.map((leg) => {
                      const isSelected = selectedLegId === leg.id;
                      return (
                        <button
                          key={leg.id}
                          onClick={() => setSelectedLegId(leg.id)}
                          className={`w-full text-left p-3 rounded-none border flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? "bg-stone-900 border-stone-900 text-white shadow-md font-semibold"
                              : "bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800"
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="text-xs block truncate">{leg.name}</span>
                            <span className={`text-[9px] font-mono mt-0.5 block ${isSelected ? "text-stone-400" : "text-stone-500"}`}>
                              {leg.party}-{leg.state} • {leg.chamber}
                            </span>
                          </div>
                          <span className={`text-[10px] font-sans font-black px-1.5 py-0.5 rounded border ${
                            isSelected 
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30" 
                              : "bg-amber-500/10 text-amber-700 border-amber-500/20"
                          }`}>
                            {leg.libertyProsperityIndex?.grade || "B-"}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-3 border-t border-stone-200">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-[10px] font-mono uppercase font-bold text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-200 transition-colors cursor-pointer"
                    >
                      &larr; Prev
                    </button>
                    <span className="text-[10px] font-mono font-bold text-stone-500">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-[10px] font-mono uppercase font-bold text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-200 transition-colors cursor-pointer"
                    >
                      Next &rarr;
                    </button>
                  </div>
                )}

                {/* Comparative side picker */}
                <div className="pt-4 border-t border-stone-200/60 space-y-3">
                  <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest block">Comparative Side-by-Side</span>
                  <div className="space-y-2">
                    <select
                      value={compareLegId}
                      onChange={(e) => setCompareLegId(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-none p-2 text-xs font-bold text-stone-700 focus:outline-none"
                    >
                      <option value="">-- Choose Lawmaker to Compare --</option>
                      {legislators
                        .filter((l) => l.id !== selectedLegId)
                        .map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name} ({l.party}-{l.state})
                          </option>
                        ))}
                    </select>
                    {compareLegId && (
                      <button
                        onClick={() => setCompareLegId("")}
                        className="w-full text-center text-xs font-bold text-rose-600 hover:text-rose-800 transition"
                      >
                        Reset Comparison
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed scorecard / head-to-head panel (8 columns) */}
              <div className="lg:col-span-8 bg-[#F9F8F6] p-5 rounded-none border border-stone-200 shadow-sm space-y-6">
                
                {compareLeg && selectedLeg ? (
                  /* COMPARATIVE MODE */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                      <h4 className="text-sm font-sans font-extrabold text-stone-900 flex items-center gap-2">
                        <Scale className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                        Bipartisan Roster Comparison
                      </h4>
                      <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                        Side-by-Side Tally
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Left lawmaker (Selected) */}
                      <div className="p-4 bg-stone-50 border border-stone-200 rounded-none space-y-3">
                        <div className="flex items-center gap-3">
                          {selectedLeg.imageUrl && (
                            <img src={selectedLeg.imageUrl} alt={selectedLeg.name} referrerPolicy="no-referrer" className="h-10 w-10 rounded-full object-cover border" />
                          )}
                          <div>
                            <span className="text-xs font-bold block text-stone-950">{selectedLeg.name}</span>
                            <span className="text-[9px] font-mono text-stone-500 block">{selectedLeg.party}-{selectedLeg.state} • {selectedLeg.chamber}</span>
                          </div>
                        </div>
                        <div className="space-y-1.5 border-t border-stone-200/60 pt-2 text-[11px] font-mono">
                          <div className="flex justify-between">
                            <span>Liberty Grade:</span>
                            <span className="font-bold text-amber-700">{selectedLeg.libertyProsperityIndex?.grade || "B-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Attendance:</span>
                            <span className="font-bold text-stone-800">{selectedLeg.attendanceRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Consensus Align:</span>
                            <span className="font-bold text-stone-800">{selectedLeg.consensusRate || 74}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Bills Sponsored:</span>
                            <span className="font-bold text-stone-800">{selectedLeg.sponsoredBillsCount || 28}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right lawmaker (Compare) */}
                      <div className="p-4 bg-stone-50 border border-stone-200 rounded-none space-y-3">
                        <div className="flex items-center gap-3">
                          {compareLeg.imageUrl && (
                            <img src={compareLeg.imageUrl} alt={compareLeg.name} referrerPolicy="no-referrer" className="h-10 w-10 rounded-full object-cover border" />
                          )}
                          <div>
                            <span className="text-xs font-bold block text-stone-950">{compareLeg.name}</span>
                            <span className="text-[9px] font-mono text-stone-500 block">{compareLeg.party}-{compareLeg.state} • {compareLeg.chamber}</span>
                          </div>
                        </div>
                        <div className="space-y-1.5 border-t border-stone-200/60 pt-2 text-[11px] font-mono">
                          <div className="flex justify-between">
                            <span>Liberty Grade:</span>
                            <span className="font-bold text-amber-700">{compareLeg.libertyProsperityIndex?.grade || "B-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Attendance:</span>
                            <span className="font-bold text-stone-800">{compareLeg.attendanceRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Consensus Align:</span>
                            <span className="font-bold text-stone-800">{compareLeg.consensusRate || 74}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Bills Sponsored:</span>
                            <span className="font-bold text-stone-800">{compareLeg.sponsoredBillsCount || 28}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Shared roll-calls comparative index */}
                    <div className="space-y-3.5 pt-3">
                      <span className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wider block">Key Votes Roll-Call Stances</span>
                      <div className="space-y-3">
                        {SIGNIFICANT_BILLS.map((bill) => {
                          const legAVoteObj = getLegVoteOnBill(selectedLeg, bill.id);
                          const legBVoteObj = getLegVoteOnBill(compareLeg, bill.id);

                          return (
                            <div key={bill.id} className="p-3 bg-[#F9F8F6] border border-stone-150 rounded-none space-y-2">
                              <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-1.5">
                                <span className="text-xs font-bold text-stone-900">{bill.id} - {bill.title}</span>
                                <span className="text-[9px] font-mono text-stone-450 uppercase font-semibold">{bill.category}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                                <div className="p-2.5 rounded-none bg-stone-50 border border-stone-100">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-stone-700">{selectedLeg.name}:</span>
                                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                                      legAVoteObj.vote === "Yea" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                    }`}>{legAVoteObj.vote}</span>
                                  </div>
                                  <p className="text-[10px] text-stone-550 leading-relaxed mt-1.5 italic">&quot;{legAVoteObj.impact}&quot;</p>
                                </div>

                                <div className="p-2.5 rounded-none bg-stone-50 border border-stone-100">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-stone-700">{compareLeg.name}:</span>
                                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                                      legBVoteObj.vote === "Yea" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                    }`}>{legBVoteObj.vote}</span>
                                  </div>
                                  <p className="text-[10px] text-stone-550 leading-relaxed mt-1.5 italic">&quot;{legBVoteObj.impact}&quot;</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : selectedLeg ? (
                  /* SINGLE SCORECARD DETAIL MODE */
                  <div className="space-y-6">
                    {/* Lawmaker Hero Info row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                      <div className="flex items-center gap-4">
                        {selectedLeg.imageUrl ? (
                          <img src={selectedLeg.imageUrl} alt={selectedLeg.name} referrerPolicy="no-referrer" className="h-14 w-14 rounded-full object-cover border border-stone-200 shadow-xs" />
                        ) : (
                          <div className="h-14 w-14 rounded-full bg-stone-200 text-stone-500 font-bold text-xl flex items-center justify-center">{selectedLeg.name[0]}</div>
                        )}
                        <div className="space-y-1">
                          <h3 className="text-base font-sans font-extrabold text-stone-900 leading-none">{selectedLeg.name}</h3>
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            selectedLeg.party === "D" ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-red-50 text-red-700 border border-red-100"
                          }`}>
                            {selectedLeg.party === "D" ? "Democrat" : "Republican"}-{selectedLeg.state} • {selectedLeg.chamber}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2.5">
                        <button
                          onClick={() => toggleFollowLegislator(selectedLeg.id)}
                          className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                            followedLegislators.includes(selectedLeg.id)
                              ? "bg-amber-500/10 text-amber-700 border-amber-500/35 shadow-2xs"
                              : "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200"
                          }`}
                        >
                          <Star className={`h-3.5 w-3.5 ${followedLegislators.includes(selectedLeg.id) ? "fill-amber-500 text-amber-500" : ""}`} />
                          <span>{followedLegislators.includes(selectedLeg.id) ? "Bookmarked Star" : "Bookmark Follow"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Grades Bento Grid Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-none space-y-1">
                        <span className="text-[9.5px] font-mono font-bold text-stone-400 uppercase tracking-wider block">Liberty Grade</span>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-xl font-black text-amber-800">{selectedLeg.libertyProsperityIndex?.grade || "B-"}</span>
                          <span className="text-[10px] text-stone-550 font-mono">({selectedLeg.libertyProsperityIndex?.overallScore || 74}/100)</span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-none space-y-1">
                        <span className="text-[9.5px] font-mono font-bold text-stone-400 uppercase tracking-wider block">Attendance Rate</span>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-xl font-black text-stone-900">{selectedLeg.attendanceRate}%</span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-none space-y-1">
                        <span className="text-[9.5px] font-mono font-bold text-stone-400 uppercase tracking-wider block">Citizens Consensus</span>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-xl font-black text-stone-900">{selectedLeg.consensusRate || 74}%</span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-none space-y-1">
                        <span className="text-[9.5px] font-mono font-bold text-stone-400 uppercase tracking-wider block">Bills Sponsored</span>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-xl font-black text-stone-900">{selectedLeg.sponsoredBillsCount || 28}</span>
                        </div>
                      </div>
                    </div>

                    {/* Sub tabs selector inside details */}
                    <div className="flex border-b border-stone-100">
                      <button
                        onClick={() => setActiveDetailsTab("scorecard")}
                        className={`py-2 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
                          activeDetailsTab === "scorecard"
                            ? "border-amber-500 text-amber-600 font-bold"
                            : "border-transparent text-stone-500 hover:text-stone-800"
                        }`}
                      >
                        Bipartisan Key Issue Votes
                      </button>
                      <button
                        onClick={() => setActiveDetailsTab("voting-analytics")}
                        className={`py-2 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
                          activeDetailsTab === "voting-analytics"
                            ? "border-amber-500 text-amber-600 font-bold"
                            : "border-transparent text-stone-500 hover:text-stone-800"
                        }`}
                      >
                        Sponsorship & Committees
                      </button>
                    </div>

                    {activeDetailsTab === "scorecard" ? (
                      /* VOTING SCORECARD LIST */
                      <div className="space-y-3">
                        {SIGNIFICANT_BILLS.map((bill) => {
                          const voteObj = getLegVoteOnBill(selectedLeg, bill.id);
                          return (
                            <div key={bill.id} className="p-3 bg-stone-50 border border-stone-200 rounded-none flex items-start justify-between gap-3">
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-stone-200 text-stone-800 rounded font-mono font-bold text-[9px]">{bill.id}</span>
                                  <span className="text-[10px] font-mono text-stone-450 uppercase font-semibold">{bill.category}</span>
                                </div>
                                <h4 className="text-xs font-bold text-stone-900 leading-tight">{bill.title}</h4>
                                <p className="text-[11px] text-stone-550 leading-normal line-clamp-2">{bill.desc}</p>
                                <p className="text-[10.5px] text-stone-650 italic mt-2 p-2 bg-[#F9F8F6] rounded border border-stone-150 leading-relaxed">
                                  &quot;{voteObj.impact}&quot;
                                </p>
                              </div>

                              <div className="flex flex-col items-center justify-center space-y-1 bg-[#F9F8F6] border border-stone-150 p-2.5 rounded-none shrink-0 w-20">
                                <span className="text-[8px] font-mono font-bold text-stone-400 uppercase tracking-widest block text-center">Cast Vote</span>
                                <span className={`text-xs font-mono font-black text-center ${
                                  voteObj.vote === "Yea" ? "text-emerald-600" : "text-rose-600"
                                }`}>
                                  {voteObj.vote.toUpperCase()}
                                </span>
                                {voteObj.vote === "Yea" ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-rose-500" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* SPONSORSHIPS AND COMMITTEES VIEW */
                      <div className="space-y-5">
                        <div className="p-4 bg-stone-50 border border-stone-200 rounded-none space-y-3">
                          <h4 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Building2 className="h-4 w-4 text-stone-500" />
                            Assigned Congressional Committees
                          </h4>
                          {selectedLeg.committees && selectedLeg.committees.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {selectedLeg.committees.map((com, idx) => (
                                <span key={idx} className="bg-[#F9F8F6] border border-stone-250/60 text-xs text-stone-700 px-3 py-1 rounded-none font-medium shadow-2xs">
                                  {com}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-stone-450 italic">No direct standing committee listings parsed for this lawmaker.</p>
                          )}
                        </div>

                        <div className="p-4 bg-stone-50 border border-stone-200 rounded-none space-y-3.5">
                          <h4 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                            <BookOpen className="h-4 w-4 text-stone-500" />
                            Dynamic Sponsorship Profiles
                          </h4>
                          <div className="space-y-2 text-xs leading-relaxed text-stone-650">
                            <p>
                              Representative <strong>{selectedLeg.name}</strong> primarily drafts legislation with strong weightings in:
                            </p>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-mono font-bold text-[10px]">National Defense • High</span>
                              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full font-mono font-bold text-[10px]">Economic Protections • Medium</span>
                              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full font-mono font-bold text-[10px]">Small Business Credit • Normal</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-20 text-stone-400 italic text-xs bg-stone-50 rounded-none border border-dashed border-stone-200">
                    Select a politician from the left list roster to inspect their grades, sponsored bills, and voting scorecard history.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: RANKINGS & CONSTITUENT QUIZ */}
          {activeTab === "rankings" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Divergence Policy Quiz (7 columns) */}
              <div className="lg:col-span-7 bg-[#F9F8F6] p-5 rounded-none border border-stone-200 shadow-sm space-y-5">
                <div className="space-y-2 border-b border-stone-100 pb-3">
                  <span className="inline-flex items-center space-x-1.5 p-1 px-3 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-mono tracking-wider font-bold">
                    <Sparkles className="h-3 w-3 animate-pulse" />
                    <span>POLICY STANCE MATCHMAKER</span>
                  </span>
                  <h3 className="text-base font-sans font-extrabold text-stone-900">Constituent Stance Comparison Quiz</h3>
                  <p className="text-xs text-stone-500">
                    Vote on five core legislative bills to calculate your personal alignment percentage with the public consensus of {STATE_NAMES[selectedLocalState]} and their active representatives.
                  </p>
                </div>

                {!quizCompleted ? (
                  <div className="space-y-5">
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-none space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">
                          Bill {currentQuestionIndex + 1} of {QUIZ_BILLS.length}
                        </span>
                        <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase border border-indigo-100/60">
                          {QUIZ_BILLS[currentQuestionIndex].category}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-stone-900 leading-snug">
                        {QUIZ_BILLS[currentQuestionIndex].id}: {QUIZ_BILLS[currentQuestionIndex].title}
                      </h4>

                      <p className="text-xs text-stone-650 leading-relaxed bg-[#F9F8F6] p-3.5 rounded-none border border-stone-150">
                        {QUIZ_BILLS[currentQuestionIndex].description}
                      </p>

                      <div className="grid grid-cols-2 gap-3.5 text-[11px] leading-relaxed font-sans">
                        <div className="p-3 rounded-none bg-emerald-500/[0.02] border border-emerald-500/15">
                          <span className="font-bold text-emerald-800 block uppercase font-mono text-[9px] tracking-wide">Arguments in Favor (PRO):</span>
                          <ul className="list-disc pl-3.5 space-y-1 text-stone-650 mt-1">
                            {QUIZ_BILLS[currentQuestionIndex].pros.map((p, i) => <li key={i}>{p}</li>)}
                          </ul>
                        </div>

                        <div className="p-3 rounded-none bg-rose-500/[0.02] border border-rose-500/15">
                          <span className="font-bold text-rose-800 block uppercase font-mono text-[9px] tracking-wide">Arguments Against (CON):</span>
                          <ul className="list-disc pl-3.5 space-y-1 text-stone-650 mt-1">
                            {QUIZ_BILLS[currentQuestionIndex].cons.map((c, i) => <li key={i}>{c}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 justify-end pt-2">
                      <button
                        onClick={() => handleAnswer(QUIZ_BILLS[currentQuestionIndex].id, "Nay")}
                        className="px-6 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-none text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <ThumbsDown className="h-4 w-4" />
                        <span>I Vote AGAINST (Nay)</span>
                      </button>

                      <button
                        onClick={() => handleAnswer(QUIZ_BILLS[currentQuestionIndex].id, "Yea")}
                        className="px-6 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold rounded-none text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>I Vote IN FAVOR (Yea)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* QUIZ COMPLETED RESULTS SCREEN */
                  <div className="space-y-5 animate-fade-in">
                    <div className="p-5 bg-indigo-950 text-white rounded-none space-y-4 border border-indigo-900 shadow-inner">
                      <div className="flex items-center space-x-2 text-amber-500">
                        <Sparkles className="h-5 w-5 animate-spin" />
                        <span className="text-[10px] font-mono uppercase tracking-widest font-black">Calculation Finished</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-indigo-900 pb-4">
                        <div className="space-y-1 text-center bg-[#F9F8F6]/5 p-3 rounded-none border border-indigo-800">
                          <span className="text-[10px] font-mono text-stone-300 block uppercase">Public Consensus Match</span>
                          <span className="text-xl font-black text-amber-400">{quizResult.overall}%</span>
                        </div>
                        <div className="space-y-1 text-center bg-[#F9F8F6]/5 p-3 rounded-none border border-indigo-800">
                          <span className="text-[10px] font-mono text-stone-300 block uppercase">Democratic Party Align</span>
                          <span className="text-xl font-black text-blue-400">{quizResult.dem}%</span>
                        </div>
                        <div className="space-y-1 text-center bg-[#F9F8F6]/5 p-3 rounded-none border border-indigo-800">
                          <span className="text-[10px] font-mono text-stone-300 block uppercase">Republican Party Align</span>
                          <span className="text-xl font-black text-red-400">{quizResult.rep}%</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider block">Your Representative Alignment Rankings:</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {quizResult.legislatorsMatch.map((match, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 bg-[#F9F8F6]/5 border border-indigo-900/60 rounded-none">
                              <span className="text-xs text-stone-200 font-semibold">{match.legislator.name} ({match.legislator.party}-{match.legislator.state})</span>
                              <span className="text-xs font-mono font-bold text-amber-400">{match.matchPercentage}% stance agreement</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={resetQuiz}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-none text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs border border-stone-200"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Take Quiz Again</span>
                    </button>
                  </div>
                )}
              </div>

              {/* State rankings - Worst / Best Aligned delegations (5 columns) */}
              <div className="lg:col-span-5 bg-[#F9F8F6] p-5 rounded-none border border-stone-200 shadow-sm space-y-5">
                <div className="space-y-1 border-b border-stone-100 pb-3">
                  <h3 className="text-xs font-mono font-bold tracking-widest text-stone-400 uppercase flex items-center gap-1">
                    <Scale className="h-4 w-4 text-amber-500" /> State Divergence Rankings
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    States ranked by how well their representatives match local citizen consensus polling:
                  </p>
                </div>

                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {stateRankings.map((state, idx) => {
                    const isWorst = idx < 10;
                    return (
                      <div
                        key={state.code}
                        onClick={() => {
                          onStateChange(state.code);
                          setActiveTab("legislators");
                        }}
                        className={`p-2.5 rounded-none border flex items-center justify-between transition-all cursor-pointer ${
                          selectedLocalState.toUpperCase() === state.code.toUpperCase()
                            ? "bg-stone-900 text-white border-stone-900 shadow-sm font-semibold"
                            : "bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono text-stone-400 font-bold w-5">#{idx + 1}</span>
                          <span className="text-xs">{state.name} ({state.code})</span>
                        </div>

                        <div className="flex items-center space-x-3 text-[10px] font-mono">
                          {isWorst && (
                            <span className="text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded font-extrabold uppercase">
                              Divergent
                            </span>
                          )}
                          <span className="font-bold text-stone-500">CAI Score: <span className="text-stone-800 font-black">{state.caiScore}%</span></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
        </div>
      )}
    </div>
  );
}
