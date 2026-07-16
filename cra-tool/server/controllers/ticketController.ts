import Ticket from '../models/Ticket';
import StatusHistory from '../models/StatusHistory';
import Notification from '../models/Notification';
import Advisory from '../models/Advisory';
import Report from '../models/Report';
import Activity from '../models/Activity';
import { logActivity } from '../services/activityLog';
import { canTransition, isBackward, CLOSE_REASON_BY_STAGE, guardTransition } from '../services/stateMachine';

// Human-readable decision label for each forward transition — recorded in
// the Activity Timeline so any engineer can read the case history at a glance.
const DECISION_LABELS = {
  'receipt>validation':       { action: 'Started validation' },
  'validation>verification':  { action: 'Validated the report against the CVD policy', decision: 'Valid' },
  'validation>closed':        { action: 'Validated the report against the CVD policy', decision: 'Invalid — case closed' },
  'verification>closed':      { action: 'Completed verification', decision: 'Not exploitable — closed as VEX' },
  'remediation>advisory':     { action: 'Completed remediation documentation' },
  'advisory>disclosure':      { action: 'Confirmed advisory readiness — disclosure started' },
  'disclosure>reporting':     { action: 'Published the advisory and update', decision: 'Disclosure complete — reporting required' },
  'disclosure>closed':        { action: 'Published the advisory and update', decision: 'Disclosure complete — no reporting required, case closed' },
  'reporting>closed':         { action: 'Submitted all required reports', decision: 'Case closed — lifecycle completed' },
};

// PCERT standard responses to the researcher (and users/authority), logged as
// the case moves through decisions. Closure responses carry the case manager's
// comment as the reason.
const withReason = (note) => (note ? ` Reason: ${note}.` : '');

const CLOSE_NOTIFICATIONS = {
  invalid: (t, note) => [
    { audience: 'finder', message: `Standard response sent for ${t.ticketNumber}: report is NOT VALID per the CVD policy.${withReason(note)} Case closed.` },
  ],
  not_exploitable: (t, note) => [
    { audience: 'finder', message: `Standard response sent for ${t.ticketNumber}: vulnerability is NOT EXPLOITABLE under practical conditions (VEX documented).${withReason(note)} Case closed.` },
  ],
  completed: (t) => [
    { audience: 'finder', message: `Final notification sent to finder — case ${t.ticketNumber} closed with full lifecycle completed.` },
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

    // Workflow-controlled fields are never accepted from the client
    const {
      status, classification, closedReason, cvss, remediation, advisoryChecks,
      certNotifiedAt, disclosure, clockStartedAt, mitigationDeployedAt, ...body
    } = req.body;

    const ticket = new Ticket({ ...body, ticketNumber, status: 'receipt' });
    await ticket.save();

    await logActivity(ticket._id, req.user.userId, {
      type: 'created',
      action: `Registered case ${ticketNumber} via intake`,
      note: ticket.title || undefined,
      stageAfter: 'receipt',
    });
    if (ticket.caseManager) {
      await logActivity(ticket._id, req.user.userId, {
        type: 'ownership',
        action: 'Assigned case ownership',
        decision: `Owner: ${ticket.caseManager}`,
        stageAfter: 'receipt',
      });
    }

    await Notification.create({
      ticketId: ticket._id,
      audience: 'finder',
      message:  `Acknowledgement sent to researcher with reference number ${ticketNumber} (7-day confirmation window per CVD policy). Case manager to be assigned (PSSO of affected product).`,
    });

    res.status(201).json(ticket);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PATCH for case fields only (title, description, reporter, caseManager, products, environment, isIncident)
export const update = async (req, res) => {
  try {
    const {
      status, classification, closedReason, cvss, remediation, advisoryChecks,
      certNotifiedAt, disclosure, clockStartedAt, mitigationDeployedAt, ticketNumber,
      ...allowed
    } = req.body;
    allowed.updatedAt = new Date();

    const before = await Ticket.findById(req.params.id).select('caseManager status').lean() as any;
    if (!before) return res.status(404).json({ message: 'Ticket not found' });

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      allowed,
      { new: true, runValidators: true }
    );
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Ownership changes are first-class timeline events for distributed teams
    if (allowed.caseManager !== undefined && allowed.caseManager !== before.caseManager) {
      await logActivity(ticket._id, req.user.userId, {
        type: 'ownership',
        action: 'Changed case ownership',
        decision: `Owner: ${before.caseManager || 'Unassigned'} → ${allowed.caseManager || 'Unassigned'}`,
        stageAfter: ticket.status,
      });
    }
    res.json(ticket);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PATCH stage documentation: remediation doc, advisory readiness checks,
// disclosure fields. Saving documentation is not a workflow decision — it
// never changes the stage; the transition endpoint enforces completeness.
export const updateStageData = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.status === 'closed') {
      return res.status(400).json({ message: 'Case is closed — stage data is read-only' });
    }

    const { remediation, advisoryChecks, disclosure } = req.body;
    const merge = (current: any, patch: any) => ({
      ...(current && typeof current.toObject === 'function' ? current.toObject() : current),
      ...patch,
    });
    if (remediation)    ticket.set('remediation',    merge(ticket.remediation, remediation));
    if (advisoryChecks) ticket.set('advisoryChecks', merge(ticket.advisoryChecks, advisoryChecks));
    if (disclosure)     ticket.set('disclosure',     merge(ticket.disclosure, disclosure));
    ticket.updatedAt = new Date();
    await ticket.save();

    const sections = [
      remediation    && 'remediation documentation',
      advisoryChecks && 'advisory readiness checks',
      disclosure     && 'disclosure details',
    ].filter(Boolean).join(', ');
    await logActivity(ticket._id, req.user.userId, {
      type: 'stage_data',
      action: `Updated ${sections}`,
      stageAfter: ticket.status,
    });
    res.json(ticket);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST notify-cert: the gate between Advisory and Disclosure. Requires the
// three readiness checks; stamps certNotifiedAt and records the notification.
export const notifyCert = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.status !== 'advisory') {
      return res.status(400).json({ message: 'CERT notification happens in the Advisory stage' });
    }
    const c = ticket.advisoryChecks || ({} as any);
    if (!c.workMethodDefined || !c.patchAvailable || !c.productListAvailable) {
      return res.status(400).json({ message: 'All three readiness checks (work method, patch, product list) must be Yes before notifying CERT' });
    }
    if (ticket.certNotifiedAt) {
      return res.status(400).json({ message: 'CERT has already been notified' });
    }

    ticket.certNotifiedAt = new Date();
    ticket.updatedAt = new Date();
    await ticket.save();

    await logActivity(ticket._id, req.user.userId, {
      type: 'cert',
      action: 'Notified CERT — advisory readiness confirmed',
      note: req.body.note,
      stageAfter: 'advisory',
    });
    await Notification.create({
      ticketId: ticket._id,
      audience: 'authority',
      message:  `CERT notified for ${ticket.ticketNumber} — advisory readiness confirmed (work method, patch, product list). Disclosure may proceed.`,
    });

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// The workflow engine: one decision per stage advances the case.
// Body: { toStatus, note?, classification?, cvss? }
export const transition = async (req, res) => {
  try {
    const { toStatus, note, classification, cvss } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (!canTransition(ticket.status, toStatus)) {
      return res.status(400).json({
        message: `Cannot move from '${ticket.status}' to '${toStatus}'`,
      });
    }

    const fromStatus = ticket.status;
    const notifs = [];
    const backward = isBackward(fromStatus, toStatus);

    // ── Backward move / reopen: revising an earlier decision ───
    // Documented data is preserved; only the closure marker is cleared.
    if (backward) {
      const wasClosed = fromStatus === 'closed';
      if (wasClosed) ticket.closedReason = null;
      ticket.status    = toStatus;
      ticket.updatedAt = new Date();
      await ticket.save();
      await logActivity(ticket._id, req.user.userId, {
        type: 'moved_back',
        action: wasClosed
          ? `Reopened the case — returned to ${toStatus.replace(/_/g, ' ')}`
          : `Moved the case back to ${toStatus.replace(/_/g, ' ')} to revise a decision`,
        note,
        stageAfter: toStatus,
      });
      return res.json(ticket);
    }

    // ── Verification → remediation: the two-part decision ───────
    // Decision 1 (exploitable? no → closed) is the other branch; this branch
    // is "yes" and therefore requires Decision 2, the classification.
    if (fromStatus === 'verification' && toStatus === 'remediation') {
      if (!['actively_exploitable', 'exploitable'].includes(classification)) {
        return res.status(400).json({ message: 'A classification (actively_exploitable | exploitable) is required — the vulnerability was assessed as exploitable' });
      }
      if (cvss && typeof cvss.score === 'number') ticket.cvss = cvss;
      if (!ticket.cvss || typeof ticket.cvss.score !== 'number') {
        return res.status(400).json({ message: 'A CVSS assessment is required before classification' });
      }
      ticket.classification = classification;

      // CRA reporting obligations start ONLY for actively exploitable cases
      if (classification === 'actively_exploitable' && !ticket.clockStartedAt) {
        ticket.clockStartedAt = new Date();
        notifs.push({ audience: 'authority', message: 'Classified ACTIVELY EXPLOITABLE — highest priority, immediate remediation. CRA Art. 14 reporting obligations start now (24h early warning).' });
      }
    }

    // ── Stage-completeness guards (remediation doc, advisory, disclosure) ──
    const guardError = guardTransition(ticket, toStatus);
    if (guardError) return res.status(400).json({ message: guardError });

    // ── Reporting → closed: every required report must be submitted ──
    if (fromStatus === 'reporting' && toStatus === 'closed') {
      const reports = await Report.find({ ticketId: ticket._id });
      const submitted = (type) => reports.some((r: any) => r.type === type && r.submittedAt);
      const missing = ['initial', 'detailed', 'final'].filter(t => !submitted(t));
      if (missing.length) {
        return res.status(400).json({ message: `Cannot close — reports not yet submitted: ${missing.join(', ')}` });
      }
    }

    if (toStatus === 'closed') {
      ticket.closedReason = CLOSE_REASON_BY_STAGE[fromStatus] || 'completed';
      const buildClose = CLOSE_NOTIFICATIONS[ticket.closedReason];
      if (buildClose) notifs.push(...buildClose(ticket, note));
    }

    if (fromStatus === 'validation' && toStatus === 'verification') {
      notifs.push({ audience: 'finder', message: `Standard response sent for ${ticket.ticketNumber}: report is VALID per the CVD policy — please stand by. Passed to development for verification.` });
    }

    // Remediation completed → fix documented and available
    if (fromStatus === 'remediation' && toStatus === 'advisory') {
      if (!ticket.mitigationDeployedAt) ticket.mitigationDeployedAt = new Date();
      notifs.push({ audience: 'finder', message: `Remediation for ${ticket.ticketNumber} completed and documented — advisory preparation started.` });
    }

    // Leaving disclosure = the advisory is published and users are informed
    if (fromStatus === 'disclosure') {
      await Advisory.updateMany(
        { ticketId: ticket._id, publishedAt: null },
        { $set: { publishedAt: new Date(), updatedAt: new Date() } }
      );
      notifs.push(
        { audience: 'users',  message: 'Disclosure complete — advisory and update instructions published to product users.' },
        { audience: 'finder', message: `Standard response sent for ${ticket.ticketNumber}: vulnerability disclosed — researcher informed and their contribution acknowledged.` },
      );
    }

    ticket.status    = toStatus;
    ticket.updatedAt = new Date();
    await ticket.save();

    // ── Timeline entry with the decision spelled out ────────────
    const label: any = DECISION_LABELS[`${fromStatus}>${toStatus}`] || {
      action: `Moved the case from ${fromStatus.replace(/_/g, ' ')} to ${toStatus.replace(/_/g, ' ')}`,
    };
    let decisionText = label.decision;
    if (fromStatus === 'verification' && toStatus === 'remediation') {
      decisionText = classification === 'actively_exploitable'
        ? 'Exploitable — classified ACTIVELY EXPLOITABLE (highest priority, reporting required)'
        : 'Exploitable — classified EXPLOITABLE (standard remediation, no reporting)';
      label.action = 'Completed verification and classified the vulnerability';
    }
    await logActivity(ticket._id, req.user.userId, {
      type: toStatus === 'closed' ? 'closure' : 'transition',
      action: label.action,
      decision: decisionText,
      note,
      stageAfter: toStatus,
      meta: fromStatus === 'verification' && ticket.cvss?.score != null
        ? { cvss: ticket.cvss.score, severity: ticket.cvss.severity }
        : undefined,
    });

    if (notifs.length) {
      await Notification.insertMany(notifs.map(n => ({ ticketId: ticket._id, ...n })));
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE notify-cert: undo the CERT notification so the advisory-stage
// decision can be revised. Only possible before disclosure has begun.
export const resetCertNotification = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.status !== 'advisory') {
      return res.status(400).json({ message: 'CERT notification can only be reset while the case is in the Advisory stage' });
    }
    if (!ticket.certNotifiedAt) {
      return res.status(400).json({ message: 'CERT has not been notified' });
    }
    ticket.certNotifiedAt = null;
    ticket.updatedAt = new Date();
    await ticket.save();
    await logActivity(ticket._id, req.user.userId, {
      type: 'cert',
      action: 'Reset the CERT notification — advisory checks reopened',
      note: req.body.note,
      stageAfter: 'advisory',
    });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE a case and everything attached to it (history, notifications,
// reports, advisories). Irreversible — the client confirms before calling.
export const remove = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    await Promise.all([
      StatusHistory.deleteMany({ ticketId: ticket._id }),
      Activity.deleteMany({ ticketId: ticket._id }),
      Notification.deleteMany({ ticketId: ticket._id }),
      Report.deleteMany({ ticketId: ticket._id }),
      Advisory.deleteMany({ ticketId: ticket._id }),
    ]);
    await ticket.deleteOne();

    res.json({ message: `Case ${ticket.ticketNumber} and all attached records deleted` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Recent activity across ALL cases — feeds the dashboard so the team sees
// what happened last anywhere in the workspace.
export const getRecentActivity = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const activity = await Activity.find().sort({ createdAt: -1 }).limit(limit).lean();

    // Attach ticket number + title for linking
    const ids = [...new Set(activity.map(a => String(a.ticketId)))];
    const tickets = await Ticket.find({ _id: { $in: ids } }).select('ticketNumber title').lean();
    const byId = Object.fromEntries(tickets.map((t: any) => [String(t._id), t]));
    res.json(activity.map(a => ({
      ...a,
      ticketNumber: byId[String(a.ticketId)]?.ticketNumber,
      ticketTitle:  byId[String(a.ticketId)]?.title,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// The Activity Timeline: chronological, system-generated audit trail.
export const getActivity = async (req, res) => {
  try {
    const activity = await Activity.find({ ticketId: req.params.id }).sort({ createdAt: 1 });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST a comment — the only user-authored timeline entry type.
export const addComment = async (req, res) => {
  try {
    const content = (req.body.content || '').trim();
    if (!content) return res.status(400).json({ message: 'Comment text is required' });
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    await logActivity(ticket._id, req.user.userId, {
      type: 'comment',
      action: 'Commented',
      note: content,
      stageAfter: ticket.status,
    });
    const activity = await Activity.find({ ticketId: ticket._id }).sort({ createdAt: 1 });
    res.status(201).json(activity);
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
