import mongoose from 'mongoose';

// Message flows from the VDMA Figure 7 process graph: every dashed arrow
// (notify finder / product users / ENISA) is logged here so the ticket
// carries an auditable communication trail.
const notificationSchema = new mongoose.Schema({
  ticketId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  audience:  { type: String, enum: ['finder', 'users', 'authority'], required: true },
  message:   { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Notification', notificationSchema);
