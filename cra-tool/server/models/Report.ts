import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  ticketId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  type:        { type: String, enum: ['initial', 'detailed', 'final'], required: true },
  dueAt:       { type: Date },
  submittedAt: { type: Date },
  content:     { type: String },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now },
});

export default mongoose.model('Report', reportSchema);
