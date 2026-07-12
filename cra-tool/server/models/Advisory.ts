import mongoose from 'mongoose';

const advisorySchema = new mongoose.Schema({
  ticketId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  title:       { type: String, required: true, trim: true },
  publishedAt: { type: Date },
  content: {
    affectedProducts: [{ type: String }],
    severity:         { type: String },
    remedies:         { type: String },
    references:       [{ type: String }],
  },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now },
});

export default mongoose.model('Advisory', advisorySchema);
