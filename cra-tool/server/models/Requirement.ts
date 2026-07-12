import mongoose from 'mongoose';

const requirementSchema = new mongoose.Schema({
  annex: { type: String, required: true },
  articleRef: { type: String, required: true },
  pillar: { type: String, required: true },
  title: { type: String, required: true },
  legalText: { type: String, required: true },
  plainEnglish: { type: String, required: true },
  appliesToClass: [{ type: String }],
  urgent: { type: Boolean, default: false },
  evidenceRequired: [{ type: String }],
  sortOrder: { type: Number, required: true },
});

export default mongoose.model('Requirement', requirementSchema);
