import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
  ticketId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  fromStatus: { type: String },
  toStatus:   { type: String, required: true },
  actor:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp:  { type: Date, default: Date.now },
  note:       { type: String, trim: true },
});

export default mongoose.model('StatusHistory', statusHistorySchema);
