import Report from '../models/Report';
import Ticket from '../models/Ticket';
import { computeDeadlines } from '../services/clockService';
import { logActivity } from '../services/activityLog';

const REPORT_LABELS = { initial: 'Early Warning', detailed: 'Detailed Notification', final: 'Final Report' };

async function logReport(report: any, userId: any, action: string) {
  const ticket = await Ticket.findById(report.ticketId).select('status').lean() as any;
  await logActivity(report.ticketId, userId, {
    type: 'report',
    action: `${action} — ${REPORT_LABELS[report.type] || report.type}`,
    stageAfter: ticket?.status || 'reporting',
  });
}

export const listForTicket = async (req, res) => {
  try {
    if (!req.query.ticketId) return res.status(400).json({ message: 'ticketId query param required' });
    const reports = await Report.find({ ticketId: req.query.ticketId }).sort({ createdAt: 1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.body.ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const deadlines = computeDeadlines(ticket.clockStartedAt, ticket.mitigationDeployedAt, ticket.isIncident);
    const dueMap    = { initial: deadlines.initial, detailed: deadlines.detailed, final: deadlines.final };

    const report = new Report({ ...req.body, dueAt: dueMap[req.body.type] || null });
    await report.save();
    await logReport(report, req.user.userId, 'Drafted CRA report');
    res.status(201).json(report);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const { updatedAt, ...allowed } = req.body;
    allowed.updatedAt = new Date();
    const before = await Report.findById(req.params.id).select('submittedAt').lean() as any;
    const report = await Report.findByIdAndUpdate(req.params.id, allowed, { new: true, runValidators: true });
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (allowed.submittedAt && !before?.submittedAt) {
      await logReport(report, req.user.userId, 'Submitted CRA report');
    }
    res.json(report);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    await logReport(report, req.user.userId, 'Deleted CRA report draft');
    res.json({ message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
