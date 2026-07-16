import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import { addComment } from '../api/vmApi';

// Activity Timeline — the case's complete audit trail. System-generated and
// read-only (comments are the only user-authored entries), so any team
// member anywhere can read the history and continue the work.
//
// Timestamps are stored in UTC and rendered in the VIEWER'S timezone with
// the zone spelled out — a case handled in Mumbai reads correctly in Munich.

const TYPE_META: Record<string, { label: string; color: string }> = {
  created:    { label: 'Created',    color: '#60a5fa' },
  transition: { label: 'Decision',   color: '#00c8c8' },
  closure:    { label: 'Closure',    color: '#00e676' },
  moved_back: { label: 'Revised',    color: '#f59e0b' },
  ownership:  { label: 'Ownership',  color: '#a78bfa' },
  stage_data: { label: 'Updated',    color: '#a8a8c8' },
  cert:       { label: 'CERT',       color: '#f87171' },
  report:     { label: 'Report',     color: '#f97316' },
  advisory:   { label: 'Advisory',   color: '#00c8c8' },
  comment:    { label: 'Comment',    color: '#818cf8' },
};

const viewerZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

function formatLocal(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZoneName: 'short',
  });
}

function formatUtc(iso: string) {
  return new Date(iso).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

export default function Timeline({ ticketId, activity, onChanged }: {
  ticketId: string;
  activity: any[];
  onChanged: () => void;
}) {
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError]     = useState('');

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    setError('');
    try {
      await addComment(ticketId, comment.trim());
      setComment('');
      onChanged();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not post the comment');
    } finally {
      setPosting(false);
    }
  }

  // Newest first — the most recent action is what the next engineer needs
  const entries = [...activity].reverse();

  return (
    <div>
      {/* Comment composer — the only user-authored entry type */}
      <form onSubmit={postComment} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
        <textarea
          className="input"
          rows={2}
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Add a comment for the team — context, findings, handoff notes…"
          style={{ resize: 'vertical', flex: 1 }}
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={posting || !comment.trim()}>
          {posting ? '…' : 'Comment'}
        </button>
      </form>
      {error && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 8 }}>{error}</div>}

      <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 16 }}>
        Times shown in your timezone — {viewerZone}. Hover any timestamp for UTC.
      </div>

      {entries.length === 0 ? (
        <p style={{ fontSize: 12.5, color: 'var(--text-3)' }}>No activity recorded yet.</p>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 22 }}>
          {/* spine */}
          <div style={{ position: 'absolute', left: 7, top: 6, bottom: 6, width: 2, background: 'var(--border)' }} />

          {entries.map((a, i) => {
            const meta = TYPE_META[a.type] || TYPE_META.transition;
            return (
              <div key={a._id || i} style={{ position: 'relative', paddingBottom: i === entries.length - 1 ? 0 : 18 }}>
                {/* node */}
                <span style={{
                  position: 'absolute', left: -22, top: 4,
                  width: 12, height: 12, borderRadius: '50%',
                  background: `${meta.color}22`, border: `2px solid ${meta.color}`,
                }} />

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 9, fontWeight: 800, color: meta.color, textTransform: 'uppercase',
                    letterSpacing: '0.08em', border: `1px solid ${meta.color}44`, background: `${meta.color}12`,
                    padding: '1px 7px', borderRadius: 20, whiteSpace: 'nowrap',
                  }}>
                    {meta.label}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                    {a.actorName || 'System'}
                  </span>
                  {a.actorOrg && (
                    <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>· {a.actorOrg}</span>
                  )}
                  <span
                    className="mono"
                    title={formatUtc(a.createdAt)}
                    style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto', whiteSpace: 'nowrap', cursor: 'help' }}
                  >
                    {formatLocal(a.createdAt)}
                  </span>
                </div>

                <div style={{ fontSize: 12.5, color: 'var(--text)', marginTop: 4, lineHeight: 1.55 }}>
                  {a.action}
                </div>

                {a.decision && (
                  <div style={{
                    display: 'inline-block', marginTop: 5, padding: '3px 10px',
                    fontSize: 11, fontWeight: 700, color: meta.color,
                    background: `${meta.color}10`, border: `1px solid ${meta.color}33`,
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    Decision: {a.decision}
                  </div>
                )}

                {a.note && (
                  <div style={{
                    fontSize: 12, color: 'var(--text-2)', marginTop: 5, lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    ...(a.type === 'comment' ? {
                      background: 'var(--card-hi)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', padding: '8px 12px',
                    } : {}),
                  }}>
                    {a.note}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <span style={{ fontSize: 9.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Stage:
                  </span>
                  <StatusBadge status={a.stageAfter} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
