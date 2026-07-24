// Shared domain types for the CRA Comply + Vulnerability Management platform.
// Mirrors the Mongoose models in cra-tool/server/models.

export type TicketStatus =
  | 'receipt'
  | 'validation'
  | 'verification'
  | 'remediation'
  | 'advisory'
  | 'disclosure'
  | 'reporting'
  | 'closed';

// Independent of workflow status — decided during verification
export type Classification = 'actively_exploitable' | 'exploitable';

export type ClosedReason = 'invalid' | 'not_exploitable' | 'completed';

export interface Cvss {
  score: number;
  severity: string;
  vector: string;
}

export interface RemediationDoc {
  rootCause?: string;
  method?: string;
  fixDescription?: string;
  workaround?: string;
}

export interface AdvisoryChecks {
  workMethodDefined?: boolean;
  patchAvailable?: boolean;
  productListAvailable?: boolean;
}

export interface DisclosureData {
  updateAvailable?: boolean;
  updateInstructionsAvailable?: boolean;
  updateUrl?: string;
  advisoryCompleted?: boolean;
}

// Researcher acknowledgement at receipt / validation (CVD policy)
export interface NotifyStage {
  researcherNotified?: boolean;
  researcherNotifiedAt?: string | null;
}

export interface VerificationDoc {
  observations?: string;
  attachmentLink?: string;
  riskLevel?: string;   // Low | Moderate | High | Critical
}

export interface Attachment {
  _id: string;
  originalName: string;
  filename: string;
  mimeType?: string;
  size?: number;
  uploadedByName?: string;
  uploadedAt: string;
}

export interface Reference {
  _id?: string;
  label?: string;
  url?: string;
}

export type SourceChannel = 'email' | 'phone' | 'internal_testing' | 'supplier' | 'threat_intelligence' | 'other';

export interface AffectedProduct {
  name: string;
  version?: string;
  _id?: string;
}

export interface Ticket {
  _id: string;
  ticketNumber: string;
  title?: string;
  description: string;
  reporterName?: string;
  reporterContact?: string;   // legacy single contact field (pre-split cases)
  reporterEmail?: string;
  reporterPhone?: string;
  reporterAddress?: string;
  affectedProducts: AffectedProduct[];
  environment?: string;
  sourceChannel: SourceChannel;
  caseManager?: string;
  status: TicketStatus;
  classification?: Classification | null;
  closedReason?: ClosedReason | null;
  receipt?: NotifyStage;
  validation?: NotifyStage;
  verification?: VerificationDoc;
  cvss?: Partial<Cvss> | null;
  remediation?: RemediationDoc;
  advisoryChecks?: AdvisoryChecks;
  attachments?: Attachment[];
  references?: Reference[];
  certNotifiedAt?: string | null;
  disclosure?: DisclosureData;
  isIncident: boolean;
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
