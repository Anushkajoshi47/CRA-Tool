import mongoose from 'mongoose';

const complianceItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  requirementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Requirement', required: true },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'done', 'needs_review'],
    default: 'not_started',
  },
  notes: { type: String, default: '' },
  evidenceDescription: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('ComplianceItem', complianceItemSchema);
