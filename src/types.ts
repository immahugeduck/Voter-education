export interface Accomplishment {
  id: string;
  title: string;
  category: string;
  outcome: string;
  date: string;
  synopsis: string;
  impact: string;
  tags: string[];
}

export interface LegislativeSession {
  chamber: 'House' | 'Senate' | 'Joint' | string;
  date: string;
  time: string;
  topic: string;
  status: 'Active' | 'Scheduled' | 'Tentative' | 'Adjourned' | 'Recess' | string;
  importance: 'High' | 'Medium' | 'Low' | string;
  details: string;
}

export interface RollCallVote {
  billId: string;
  billTitle: string;
  rollCallNum: string;
  votedChamber: 'House' | 'Senate' | string;
  date: string;
  question: string;
  result: 'Passed' | 'Failed' | 'Agreed to' | 'Rejected' | string;
  yeas: number;
  nays: number;
  isHighlyDisputed: boolean;
  partyBreakdown: string;
}

export interface PendingBillSummary {
  billId: string;
  officialTitle: string;
  status: string;
  sponsorName: string;
  sponsorPartyChamber: string;
  oneLiner: string;
  plainSummary: string;
  keyProvisions: string[];
  pros: string[];
  cons: string[];
  financialImpact?: string;
}

export interface SearchedBill {
  id: string;
  title: string;
  sponsor: string;
  dateIntroduced?: string;
  status: string;
  category?: string;
  oneLiner: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface LegislatorScorecard {
  id: string;
  name: string;
  state: string;
  party: 'D' | 'R' | 'I' | string;
  chamber: 'Senate' | 'House' | string;
  imageUrl?: string;
  attendanceRate: number;
  billsSponsored: number;
  billsCosponsored: number;
  consensusRate?: number;
  sponsoredBillsCount?: number;
  committees?: string[];
  keyIssueAlignment: {
    issue: string;
    alignmentRate: number;
  }[];
  attendanceTrend: { year: number; rate: number }[];
  votingHistory: {
    billId: string;
    billTitle: string;
    vote: 'Yea' | 'Nay' | 'Not Voting' | string;
    date: string;
    impact: string;
  }[];
  libertyProsperityIndex?: {
    overallScore: number;
    constituentBenefit: number;
    freedomSafeguard: number;
    happinessPursuit: number;
    grade: string;
    summary: string;
  };
  lobbyistPacFunding?: {
    totalFunding: number;
    pacPercentage: number;
    individualPercentage: number;
    topSectors: { sector: string; amount: number; percentage: number }[];
    majorPacDonors: { donor: string; amount: number; industry: string }[];
  };
}

export interface UpcomingVoteAlert {
  id: string;
  billId: string;
  billTitle: string;
  billUrl: string;
  scheduledTime: string;
  importance: 'Critical' | 'High' | 'Medium' | string;
  plainSummary: string;
  predictedVotes: {
    legislatorId: string;
    legislatorName: string;
    prediction: 'Yea' | 'Nay' | 'Slight Yea' | 'Slight Nay' | 'Undecided' | string;
    confidence: number;
    reasoning: string;
  }[];
}

export interface DailyBrief {
  date: string;
  headline: string;
  summary: string;
  keyTakeaways: string[];
  scheduledItems: {
    chamber: string;
    topic: string;
    time: string;
    status: string;
  }[];
  mediaHeat: number;
}

export interface KeyIssue {
  id: string;
  title: string;
  category: string;
  status: string;
  description: string;
  consensus: number;
  viewpoints: {
    pro: string;
    con: string;
  };
  latestMovement: string;
}

