import Ticket from '../models/Ticket';
import StatusHistory from '../models/StatusHistory';
import Notification from '../models/Notification';
import Advisory from '../models/Advisory';
import { canTransition } from '../services/stateMachine';

// Message flows from VDMA Figure 7, worded per the PCERT standard-response
// catalogue (PCERT handler / case manager -> security researcher). Closure
// responses carry the case manager's reason from the transition note.
const withReason = (note) => (note ? ` Reason: ${note}.` : '');

const NOTIFICATIONS_ON_ENTER = {
  determining_type: (t, note) => [
    { audience: 'finder', message: `Standard response sent for ${t.ticketNumber}: vulnerability report is VALID — please stand by for additional information. Ticket passed to development to verify/reproduce.` },
  ],
  invalid: (t, note) => [
    { audience: 'finder', message: `Standard response sent for ${t.ticketNumber}: report is NOT VALID — initial validation by PSSE failed.${withReason(note)} Ticket closed.` },
  ],
  not_reproducible: (t, note) => [
    { audience: 'finder', message: `Standard response sent for ${t.ticketNumber}: vulnerability is NOT VERIFIABLE — development and PSSE could not reproduce it.${withReason(note)} Ticket closed.` },
  ],
  not_exploitable: (t, note) => [
    { audience: 'finder', message: `Standard response sent for ${t.ticketNumber}: vulnerability verified but NOT EXPLOITABLE under practical conditions.${withReason(note)} Ticket closed.` },
  ],
  not_verified: (t, note) => [
    { audience: 'finder', message: `Standard response sent for ${t.ticketNumber}: incident not verifiable or not caused by a vulnerability in our product.${withReason(note)} Ticket closed.` },
  ],
  urgent_verifying: (t) => [
    { audience: 'finder', message: `Report ${t.ticketNumber} claims active exploitation — urgent ticket created, immediate verification required.` },
  ],
  actively_exploited: (t) => [
    { audience: 'authority', message: 'Active exploitation confirmed — CRA Art. 14 reporting obligations start now (24h early warning to ENISA).' },
  ],
  documenting_advisory: (t) => [
    { audience: 'finder', message: `Mitigation for ${t.ticketNumber} completed — finder notified.` },
  ],
  advisory_published: (t) => [
    { audience: 'users',  message: 'Advisory published — product users notified per responsible-disclosure policy.' },
    { audience: 'finder', message: `Standard response sent for ${t.ticketNumber}: security advisory released — researcher informed and their contribution acknowledged.` },
  ],
  closed: (t) => [
    { audience: 'finder', message: `Final notification sent to finder — ticket ${t.ticketNumber} closed.` },
  ],
};

export const list = async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const get = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const year  = new Date().getFullYear();
    const count = await Ticket.countDocuments({ ticketNumber: { $regex: `^PSIRT-${year}-` } });
    const ticketNumber = `PSIRT-${year}-${String(count + 1).padStart(4, '0')}`;

    // Strip any status or clock fields — these are controlled exclusively
    const { status, activelyExploited, clockStartedAt, mitigationDeployedAt, ...body } = req.body;

    const ticket = new Ticket({ ...body, ticketNumber, status: 'received' });
    await ticket.save();

    await StatusHistory.create({
      ticketId:   ticket._id,
      fromStatus: null,
      toStatus:   'received',
      actor:      req.user.userId,
      note:       'Ticket created via intake',
    });

    await Notification.create({
      ticketId: ticket._id,
      audience: 'finder',
      message:  `Acknowledgement sent to researcher with reference number ${ticketNumber} (7-day confirmation window per CVD policy). Next: assign case manager (PSSO of affected product) who navigates the ticket to closure; case manager assigns PSSE to validate.`,
    });

    res.status(201).json(ticket);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PATCH for editable fields only (description, reporterContact, affectedProducts, isIncident)
export const update = async (req, res) => {
  try {
    const { status, activelyExploited, clockStartedAt, mitigationDeployedAt, ticketNumber, ...allowed } = req.body;
    allowed.updatedAt = new Date();

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      allowed,
      { new: true, runValidators: true }
    );
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const transition = async (req, res) => {
  try {
    const { toStatus, note } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (!canTransition(ticket.status, toStatus)) {
      return res.status(400).json({
        message: `Cannot transition from '${ticket.status}' to '${toStatus}'`,
      });
    }

    const fromStatus  = ticket.status;
    ticket.status     = toStatus;
    ticket.updatedAt  = new Date();

    // CRA reporting obligations start here (VDMA Figure 7 red marker)
    if (toStatus === 'actively_exploited') {
      ticket.clockStartedAt    = new Date();
      ticket.activelyExploited = true;
    }
    // Mitigation is in the field once residual risk assessment begins
    if (toStatus === 'assessing_residual_risk' && !ticket.mitigationDeployedAt) {
      ticket.mitigationDeployedAt = new Date();
    }
    // Publishing stamps the ticket's draft advisory
    if (toStatus === 'advisory_published') {
      await Advisory.updateMany(
        { ticketId: ticket._id, publishedAt: null },
        { $set: { publishedAt: new Date(), updatedAt: new Date() } }
      );
    }

    await ticket.save();

    await StatusHistory.create({
      ticketId:   ticket._id,
      fromStatus,
      toStatus,
      actor:      req.user.userId,
      note:       note || '',
    });

    const buildNotifs = NOTIFICATIONS_ON_ENTER[toStatus];
    if (buildNotifs) {
      const docs = buildNotifs(ticket, note).map(n => ({ ticketId: ticket._id, ...n }));
      await Notification.insertMany(docs);
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getHistory = async (req, res) => {
  try {
    const history = await StatusHistory.find({ ticketId: req.params.id }).sort({ timestamp: 1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ ticketId: req.params.id }).sort({ createdAt: 1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
