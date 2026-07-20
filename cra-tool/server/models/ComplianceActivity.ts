import mongoose from 'mongoose';

// Audit trail for the CRA compliance side (products + requirement statuses),
// mirroring the VM Activity Timeline. Now that the product registry is shared
// across the seven regional officers, the team needs to see WHO changed what.
//
// Actor name/organization and the product name are SNAPSHOTTED at write time
// so the feed stays accurate even if a user or product is later renamed or
// deleted. Timestamps are UTC; the client renders them in each viewer's zone.

const complianceActivitySchema = new mongoose.Schema({
  productId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', index: true },
  productName: { type: String, trim: true },

  action:      { type: String, required: true, trim: true },   // "Updated compliance status", …
  detail:      { type: String, trim: true },                   // "Art. 11 · Vulnerability handling → Compliant"

  actorId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorName:   { type: String, trim: true, default: 'System' },
  actorOrg:    { type: String, trim: true },

  meta:        { type: mongoose.Schema.Types.Mixed },   // extension point (future SLA/AI)
  createdAt:   { type: Date, default: Date.now, index: true },
});

export default mongoose.model('ComplianceActivity', complianceActivitySchema);
