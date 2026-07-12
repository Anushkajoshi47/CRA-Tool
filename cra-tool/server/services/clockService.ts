const H24 =  24 * 3_600_000;
const H72 =  72 * 3_600_000;
const D14 = 14 * 24 * 3_600_000;
const D30 = 30 * 24 * 3_600_000;

// CRA Art. 14 deadlines (VDMA guideline ch. 10):
//   initial  = clockStartedAt + 24h            (early warning)
//   detailed = clockStartedAt + 72h            (vulnerability/incident notification)
//   final    — actively exploited vulnerability: mitigationDeployedAt + 14d
//            — serious security incident:        notification (72h mark) + 1 month
function computeDeadlines(clockStartedAt, mitigationDeployedAt, isIncident = false) {
  if (!clockStartedAt) return { initial: null, detailed: null, final: null };

  const start = new Date(clockStartedAt).getTime();
  let final = null;
  if (isIncident) {
    final = new Date(start + H72 + D30);
  } else if (mitigationDeployedAt) {
    final = new Date(new Date(mitigationDeployedAt).getTime() + D14);
  }

  return {
    initial:  new Date(start + H24),
    detailed: new Date(start + H72),
    final,
  };
}

export { computeDeadlines };
