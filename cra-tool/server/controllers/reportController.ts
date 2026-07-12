import Report from '../models/Report';
import Ticket from '../models/Ticket';
import { computeDeadlines } from '../services/clockService';

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
    res.status(201).json(report);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const { updatedAt, ...allowed } = req.body;
    allowed.updatedAt = new Date();
    const report = await Report.findByIdAndUpdate(req.params.id, allowed, { new: true, runValidators: true });
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json({ message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
