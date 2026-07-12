import mongoose from 'mongoose';

// States follow the VDMA Figure 7 process graph — see services/stateMachine.js
const TICKET_STATES = [
  'received',
  'validating',
  'invalid',                  // terminal — rejected at validation, finder notified
  'determining_type',         // valid report; decide standard vs urgent branch
  // standard branch
  'verifying',
  'not_reproducible',         // terminal — finder notified
  'assessing_risk',
  'not_exploitable',          // terminal — not exploitable under practical conditions (VEX)
  'determining_urgency',      // known exploitable vulnerability
  // urgent branch (report claims active exploitation)
  'urgent_verifying',
  'not_verified',             // terminal — not verifiable / not caused by vuln in our product
  'actively_exploited',       // CRA Art. 14 reporting obligations start here
  // remediation loop
  'root_cause_analysis',
  'developing_mitigation',
  'deploying_mitigation',
  'assessing_residual_risk',
  // publication
  'documenting_advisory',
  'advisory_published',
  'closed',
];

const ticketSchema = new mongoose.Schema({
  ticketNumber:     { type: String, unique: true },
  affectedProducts: [{
    name:    { type: String, trim: true },
    version: { type: String, trim: true },
  }],
  sourceChannel:   {
    type: String,
    enum: ['email', 'phone', 'internal_testing', 'supplier', 'other'],
    required: true,
  },
  reporterContact: { type: String, trim: true },
  // PCERT case manager — preferably the PSSO of the affected product;
  // navigates the ticket to closure and assigns PSSE for validation.
  caseManager:     { type: String, trim: true },
  description:     { type: String, required: true },
  status:          { type: String, enum: TICKET_STATES, default: 'received' },
  // Serious security incident (CRA Art. 14 §3) instead of an actively exploited
  // vulnerability — changes the final-report deadline to 1 month after notification.
  isIncident:            { type: Boolean, default: false },
  activelyExploited:     { type: Boolean, default: false },
  clockStartedAt:        { type: Date },   // set on → actively_exploited
  mitigationDeployedAt:  { type: Date },   // set on → assessing_residual_risk; drives 14-day final report
  createdAt:             { type: Date, default: Date.now },
  updatedAt:             { type: Date, default: Date.now },
});

const Ticket = mongoose.model('Ticket', ticketSchema);
export { TICKET_STATES };
export default Ticket;
