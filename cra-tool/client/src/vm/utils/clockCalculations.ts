const H24 =  24 * 3_600_000;
const H72 =  72 * 3_600_000;
const D14 = 14 * 24 * 3_600_000;
const D30 = 30 * 24 * 3_600_000;

// Mirrors server/services/clockService.js — CRA Art. 14 deadlines:
//   initial  = clockStartedAt + 24h            (early warning)
//   detailed = clockStartedAt + 72h            (notification)
//   final    — actively exploited vuln: mitigationDeployedAt + 14d
//            — serious security incident: notification (72h mark) + 1 month
export function computeDeadlines(clockStartedAt, mitigationDeployedAt, isIncident = false) {
  if (!clockStartedAt) return { initial: null, detailed: null, final: null };
  const t = new Date(clockStartedAt).getTime();
  let final = null;
  if (isIncident) {
    final = new Date(t + H72 + D30);
  } else if (mitigationDeployedAt) {
    final = new Date(new Date(mitigationDeployedAt).getTime() + D14);
  }
  return {
    initial:  new Date(t + H24),
    detailed: new Date(t + H72),
    final,
  };
}

export function timeRemaining(deadline) {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms < 0) return { overdue: true, label: 'OVERDUE', hours: 0 };
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  // Above 24h, days read faster than raw hours (335h 58m → 13d 23h)
  const label = h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h ${m}m`;
  return { overdue: false, label, hours: h };
}
