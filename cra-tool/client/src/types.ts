// Shared domain types for the CRA Comply + Vulnerability Management platform.
// Mirrors the Mongoose models in cra-tool/server/models.

export type TicketStatus =
  | 'received'
  | 'validating'
  | 'invalid'
  | 'determining_type'
  | 'verifying'
  | 'not_reproducible'
  | 'assessing_risk'
  | 'not_exploitable'
  | 'determining_urgency'
  | 'urgent_verifying'
  | 'not_verified'
  | 'actively_exploited'
  | 'root_cause_analysis'
  | 'developing_mitigation'
  | 'deploying_mitigation'
  | 'assessing_residual_risk'
  | 'documenting_advisory'
  | 'advisory_published'
  | 'closed';

export type SourceChannel = 'email' | 'phone' | 'internal_testing' | 'supplier' | 'other';

export interface AffectedProduct {
  name: string;
  version?: string;
  _id?: string;
}

export interface Ticket {
  _id: string;
  ticketNumber: string;
  affectedProducts: AffectedProduct[];
  sourceChannel: SourceChannel;
  reporterContact?: string;
  caseManager?: string;
  description: string;
  status: TicketStatus;
  isIncident: boolean;
  activelyExploited: boolean;
  clockStartedAt?: string | null;
  mitigationDeployedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistoryEntry {
  _id: string;
  ticketId: string;
  fromStatus: TicketStatus | null;
  toStatus: TicketStatus;
  actor: string;
  timestamp: string;
  note?: string;
}

export type NotificationAudience = 'finder' | 'users' | 'authority';

export interface TicketNotification {
  _id: string;
  ticketId: string;
  audience: NotificationAudience;
  message: string;
  createdAt: string;
}

export type ReportType = 'initial' | 'detailed' | 'final';

export interface Report {
  _id: string;
  ticketId: string;
  type: ReportType;
  dueAt?: string | null;
  submittedAt?: string | null;
  content?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Advisory {
  _id: string;
  ticketId: string;
  title: string;
  publishedAt?: string | null;
  content: {
    affectedProducts?: string[];
    severity?: string;
    remedies?: string;
    references?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  name: string;
  firmwareVersion?: string;
  hasNetworkInterface?: boolean;
  hasRemoteAccess?: boolean;
  soldInEU?: boolean;
  supportPeriodYears?: number;
  [key: string]: any;
}

export interface Requirement {
  _id: string;
  annex: string;
  articleRef: string;
  pillar: string;
  title: string;
  legalText: string;
  plainEnglish: string;
  urgent: boolean;
  evidenceRequired: string[];
  sortOrder: number;
}

export interface Deadlines {
  initial: Date | null;
  detailed: Date | null;
  final: Date | null;
}

export interface TimeRemaining {
  overdue: boolean;
  label: string;
  hours: number;
}
