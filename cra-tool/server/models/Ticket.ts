import mongoose from 'mongoose';

// Workflow stage — where the case is in the lifecycle (see services/stateMachine.ts)
const TICKET_STATES = [
  'receipt',
  'validation',
  'verification',
  'remediation',
  'advisory',
  'disclosure',
  'reporting',
  'closed',
];

// Classification — independent of stage; decided during verification.
//   actively_exploitable → highest priority, immediate remediation, reporting required
//   exploitable          → standard remediation, no reporting
const CLASSIFICATIONS = ['actively_exploitable', 'exploitable'];

const CLOSED_REASONS = ['invalid', 'not_exploitable', 'completed'];

const ticketSchema = new mongoose.Schema({
  ticketNumber:     { type: String, unique: true },

  // ── Receipt (intake) — visible throughout the lifecycle ──────
  title:           { type: String, trim: true },
  description:     { type: String, required: true },
  reporterName:    { type: String, trim: true },
  // Contact info split per the CRA detection-phase fields (email / phone /
  // location). `reporterContact` is kept for older cases created before the split.
  reporterContact: { type: String, trim: true },
  reporterEmail:   { type: String, trim: true },
  reporterPhone:   { type: String, trim: true },
  reporterAddress: { type: String, trim: true },   // postal address / location
  affectedProducts: [{
    name:    { type: String, trim: true },
    version: { type: String, trim: true },   // may list several, e.g. "2.0, 2.1, 2.2"
  }],
  // Operational / deployment environment of the affected product
  environment:     { type: String, trim: true },

  // Supporting material — attachments, screenshots, PoCs, advisory links.
  // Stored as label + URL so the tool needs no binary file store; the team
  // links to files held in their shared drive / tracker / advisory portal.
  references: [{
    label: { type: String, trim: true },   // e.g. "PoC screenshot", "Packet capture"
    url:   { type: String, trim: true },
  }],

  // Uploaded files (PDFs, screenshots). The binary lives on disk under
  // server/uploads/<filename>; only metadata is stored here. Each subdoc's
  // _id is the handle used to download or delete the file.
  attachments: [{
    originalName:   { type: String, trim: true },   // name shown to users
    filename:       { type: String, trim: true },   // random name on disk
    mimeType:       { type: String, trim: true },
    size:           { type: Number },
    uploadedByName: { type: String, trim: true },
    uploadedAt:     { type: Date, default: Date.now },
  }],
  sourceChannel:   {
    type: String,
    enum: ['email', 'phone', 'internal_testing', 'supplier', 'threat_intelligence', 'other'],
    required: true,
  },

  // Current owner — navigates the case to closure (preferably the PSSO).
  // Kept as a single field for now; ownership history / handoffs between
  // teams can extend this later without a schema redesign (StatusHistory
  // already records every actor).
  caseManager:     { type: String, trim: true },

  status:           { type: String, enum: TICKET_STATES, default: 'receipt' },
  classification:   { type: String, enum: [...CLASSIFICATIONS, null], default: null },
  closedReason:     { type: String, enum: [...CLOSED_REASONS, null], default: null },

  // ── Receipt stage — researcher acknowledgement (CVD policy) ──
  receipt: {
    researcherNotified:   { type: Boolean, default: false },
    researcherNotifiedAt: { type: Date },   // recorded time (shown in CEST on the client)
  },

  // ── Validation stage — researcher informed the report is valid ──
  validation: {
    researcherNotified:   { type: Boolean, default: false },
    researcherNotifiedAt: { type: Date },
  },

  // ── Verification stage — assessment notes + risk ──────────────
  verification: {
    observations:   { type: String, trim: true },
    attachmentLink: { type: String, trim: true },
    riskLevel:      { type: String },   // Low | Moderate | High | Critical
  },

  // CVSS 3.1 base score — completed during verification; drives severity/priority
  cvss: {
    score:    { type: Number, min: 0, max: 10 },
    severity: { type: String },
    vector:   { type: String },
  },

  // ── Remediation documentation ─────────────────────────────────
  remediation: {
    rootCause:      { type: String, trim: true },
    method:         { type: String, trim: true },
    fixDescription: { type: String, trim: true },
    workaround:     { type: String, trim: true },   // optional
  },

  // ── Advisory stage — pre-disclosure readiness checks ─────────
  advisoryChecks: {
    workMethodDefined:    { type: Boolean, default: false },
    patchAvailable:       { type: Boolean, default: false },
    productListAvailable: { type: Boolean, default: false },
  },
  certNotifiedAt: { type: Date },   // set by the Notify CERT action; gates disclosure

  // ── Disclosure stage ──────────────────────────────────────────
  disclosure: {
    updateAvailable:             { type: Boolean, default: false },
    updateInstructionsAvailable: { type: Boolean, default: false },
    updateUrl:                   { type: String, trim: true },
    advisoryCompleted:           { type: Boolean, default: false },
  },

  // Serious security incident — final report due 1 month after notification
  // instead of 14 days after mitigation
  isIncident:            { type: Boolean, default: false },

  clockStartedAt:        { type: Date },   // set when classified actively_exploitable
  mitigationDeployedAt:  { type: Date },   // set when remediation is completed
  createdAt:             { type: Date, default: Date.now },
  updatedAt:             { type: Date, default: Date.now },
});

const Ticket = mongoose.model('Ticket', ticketSchema);
export { TICKET_STATES, CLASSIFICATIONS, CLOSED_REASONS };
export default Ticket;
