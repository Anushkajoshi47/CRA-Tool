import mongoose from 'mongoose';

// One entry in a case's Activity Timeline — the audit trail every distributed
// team member reads to pick a case up without additional context.
//
// Entries are system-generated and immutable; the only user-authored type is
// 'comment'. Actor name/organization are SNAPSHOTTED at write time so the
// trail stays accurate even if a user is later renamed or removed.
//
// Timestamps are stored in UTC (Mongo Date) and rendered in each viewer's
// local timezone on the client — teams around the world see their own time.
//
// `meta` is a free-form extension point for future features (SLA timing,
// workflow handoffs, AI-generated summaries) — add data there, not columns.

const ACTIVITY_TYPES = [
  'created',        // case registered via intake
  'transition',     // stage moved forward (a workflow decision)
  'moved_back',     // stage moved backward / case reopened (revision)
  'closure',        // case closed (with reason)
  'ownership',      // case manager / owner changed
  'stage_data',     // remediation / advisory / disclosure documentation saved
  'cert',           // CERT notified or notification reset
  'report',         // CRA report drafted / submitted / deleted
  'advisory',       // advisory draft saved / published
  'comment',        // user-authored comment (the only non-system entry)
];

const activitySchema = new mongoose.Schema({
  ticketId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
  type:       { type: String, enum: ACTIVITY_TYPES, required: true },

  // What happened, in plain language ("Classified the vulnerability", "Notified CERT")
  action:     { type: String, required: true, trim: true },
  // The decision taken, when the action was a decision ("Valid", "Actively Exploitable")
  decision:   { type: String, trim: true },
  // Free-text detail: the audit note, comment body, or context
  note:       { type: String, trim: true },

  // Lifecycle position AFTER this action
  stageAfter: { type: String, required: true },

  // Actor snapshot — never re-resolved
  actorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorName:  { type: String, trim: true, default: 'System' },
  actorOrg:   { type: String, trim: true },

  // Extension point: SLA timings, handoff targets, AI summaries, …
  meta:       { type: mongoose.Schema.Types.Mixed },

  createdAt:  { type: Date, default: Date.now, index: true },
});

const Activity = mongoose.model('Activity', activitySchema);
export { ACTIVITY_TYPES };
export default Activity;
