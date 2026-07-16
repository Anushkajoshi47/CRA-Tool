import Activity from '../models/Activity';
import User from '../models/User';

// Central writer for the Activity Timeline. Every controller records through
// this so entries are uniform: actor snapshot + stage-after + UTC timestamp.
//
// Never throws — a logging failure must not break the workflow action itself.

interface LogInput {
  type: string;
  action: string;
  decision?: string;
  note?: string;
  stageAfter: string;
  meta?: Record<string, unknown>;
}

export async function logActivity(ticketId: any, userId: any, entry: LogInput) {
  try {
    let actorName = 'System';
    let actorOrg;
    if (userId) {
      const user: any = await User.findById(userId).select('name email orgName').lean();
      if (user) {
        actorName = user.name || user.email || 'Unknown user';
        actorOrg  = user.orgName || undefined;
      }
    }
    await Activity.create({
      ticketId,
      type:       entry.type,
      action:     entry.action,
      decision:   entry.decision,
      note:       entry.note || undefined,
      stageAfter: entry.stageAfter,
      actorId:    userId || undefined,
      actorName,
      actorOrg,
      meta:       entry.meta,
    });
  } catch (err: any) {
    console.error('activityLog failed:', err.message);
  }
}
