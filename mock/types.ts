export type Role = "startup" | "government" | "expert" | "validator" | "admin";

export type RiskLevel = "Low" | "Medium" | "High";

export type ProblemStatus =
  | "Draft"
  | "Published"
  | "Evaluation"
  | "Shortlisted"
  | "Pilot"
  | "Completed"
  | "Closed";

export type ApplicationStatus =
  | "Submitted"
  | "Evaluation"
  | "Review"
  | "Shortlisted"
  | "Approved"
  | "Rejected"
  | "Clarification";

export type VerificationStatus = "Verified" | "Pending" | "Flagged";

export interface Startup {
  id: string;
  name: string;
  founder: string;
  sector: string;
  state: string;
  city: string;
  founded: number;
  dpiitNo: string;
  team: number;
  website: string;
  verification: VerificationStatus;
  trustScore: number;
  womenLed: boolean;
  tagline: string;
  pastProjects: { title: string; client: string; year: number; verified: boolean }[];
}

export interface Department {
  id: string;
  name: string;
  short: string;
  state: string;
  type: string;
  trustScore: number;
  avgApprovalDays: number;
  paymentFulfilment: number;
}

export interface Problem {
  id: string;
  title: string;
  departmentId: string;
  location: string;
  state: string;
  status: ProblemStatus;
  applications: number;
  budgetLakh: number;
  durationMonths: number;
  deadline: string;
  target: string;
  category: string;
  summary: string;
  description: string;
  requirements: string[];
  criteria: { name: string; weight: number }[];
  timeline: { label: string; date: string; done: boolean }[];
  postedOn: string;
}

export interface ScoreItem {
  key: string;
  label: string;
  score: number;
  confidence: number;
  reason: string;
  evidence: string[];
}

export interface Claim {
  text: string;
  status: "Verified" | "Needs Review" | "Unsupported";
  source: string;
}

export interface Evaluation {
  applicationId: string;
  overall: number;
  confidence: number;
  risk: RiskLevel;
  breakdown: ScoreItem[];
  reasoning: string;
  keyReason: string;
  claims: Claim[];
  riskFlags: { level: RiskLevel; text: string }[];
  challenger: string[];
  evidenceUsed: string[];
}

export interface Application {
  id: string;
  problemId: string;
  startupId: string;
  status: ApplicationStatus;
  submittedOn: string;
  costEstimateLakh: number;
  technology: string;
  proposalSummary: string;
  expectedImpact: string;
  videoTranscript: string;
  documents: { name: string; type: string; status: "Verified" | "Scanned" | "Flagged" }[];
  expertComments: { expert: string; comment: string; score: number; date: string }[];
}

export interface Milestone {
  name: string;
  status: "done" | "active" | "pending";
  amountLakh: number;
  paid: "Released" | "Locked" | "Pending" | "Awaiting approval";
  dueDate: string;
}

export interface Pilot {
  id: string;
  startupId: string;
  problemId: string;
  progress: number;
  status: "On Track" | "Delayed" | "Completed";
  targetLabel: string;
  target: number;
  actual: number;
  unit: string;
  startDate: string;
  endDate: string;
  validator: string;
  milestones: Milestone[];
  weekly: { week: string; target: number; actual: number }[];
}

export interface AuditEvent {
  id: string;
  ref: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  kind: "ai" | "human" | "system" | "security";
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  kind: "info" | "success" | "warning" | "ai";
  read: boolean;
}

export interface DemoUser {
  role: Role;
  name: string;
  email: string;
  password: string;
  org: string;
  title: string;
  home: string;
}
