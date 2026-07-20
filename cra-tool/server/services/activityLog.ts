import Activity from '../models/Activity';
import ComplianceActivity from '../models/ComplianceActivity';
import User from '../models/User';

// Resolve a user id to a display snapshot (name + org). Snapshotting at write
// time keeps every audit entry accurate even if the user is later renamed.
export async function resolveActor(userId: any): Promise<{ name: string; org?: string }> {
  if (!userId) return { name: 'System' };
  const user: any = await User.findById(userId).select('name email orgName').lean();
  if (!user) return { name: 'Unknown user' };
  return { name: user.name || user.email || 'Unknown user', org: user.orgName || undefined };
}

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
    const actor = await resolveActor(userId);
    await Activity.create({
      ticketId,
      type:       entry.type,
      action:     entry.action,
      decision:   entry.decision,
      note:       entry.note || undefined,
      stageAfter: entry.stageAfter,
      actorId:    userId || undefined,
      actorName:  actor.name,
      actorOrg:   actor.org,
      meta:       entry.meta,
    });
  } catch (err: any) {
    console.error('activityLog failed:', err.message);
  }
}

interface ComplianceLogInput {
  productId?: any;
  productName?: string;
  action: string;
  detail?: string;
  meta?: Record<string, unknown>;
}

// Records a CRA compliance-side action (product or requirement-status change).
export async function logComplianceActivity(userId: any, entry: ComplianceLogInput) {
  try {
    const actor = await resolveActor(userId);
    await ComplianceActivity.create({
      productId:   entry.productId,
      productName: entry.productName,
      action:      entry.action,
      detail:      entry.detail,
      actorId:     userId || undefined,
      actorName:   actor.name,
      actorOrg:    actor.org,
      meta:        entry.meta,
    });
  } catch (err: any) {
    console.error('complianceActivityLog failed:', err.message);
  }
}
