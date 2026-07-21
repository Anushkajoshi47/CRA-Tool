import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import { addComment } from '../api/vmApi';
import { Stack, Row } from '../../components/primitives/layout';
import s from './Timeline.module.css';

// Activity Timeline — the case's complete audit trail. System-generated and
// read-only (comments are the only user-authored entries), so any team
// member anywhere can read the history and continue the work.
//
// Timestamps are stored in UTC and rendered in the VIEWER'S timezone with
// the zone spelled out — a case handled in Mumbai reads correctly in Munich.
//
// Styling reference: layout via <Stack>/<Row> primitives, appearance via the
// scoped Timeline.module.css, per-entry accent via the `--c` custom property.

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
    <Stack gap={4}>
      {/* Comment composer — the only user-authored entry type */}
      <Stack gap={2}>
        <Row as="form" gap={3} align="start" wrap={false} onSubmit={postComment}>
          <textarea
            className={`input ${s.composerInput}`}
            rows={2}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Add a comment for the team — context, findings, handoff notes…"
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={posting || !comment.trim()}>
            {posting ? '…' : 'Comment'}
          </button>
        </Row>
        {error && <div className={s.error}>{error}</div>}
        <div className={s.tzNote}>
          Times shown in your timezone — {viewerZone}. Hover any timestamp for UTC.
        </div>
      </Stack>

      {entries.length === 0 ? (
        <p className={s.empty}>No activity recorded yet.</p>
      ) : (
        <div className={s.timeline}>
          <div className={s.spine} />

          {entries.map((a, i) => {
            const meta = TYPE_META[a.type] || TYPE_META.transition;
            return (
              <div key={a._id || i} className={s.entry} style={{ ['--c' as any]: meta.color }}>
                <span className={s.node} />

                <Row gap={2} align="baseline">
                  <span className={s.typeBadge}>{meta.label}</span>
                  <span className={s.actor}>{a.actorName || 'System'}</span>
                  {a.actorOrg && <span className={s.actorOrg}>· {a.actorOrg}</span>}
                  <span className={`mono ${s.time}`} title={formatUtc(a.createdAt)}>
                    {formatLocal(a.createdAt)}
                  </span>
                </Row>

                <div className={s.action}>{a.action}</div>

                {a.decision && (
                  <div className={s.decision}>Decision: {a.decision}</div>
                )}

                {a.note && (
                  <div className={`${s.note} ${a.type === 'comment' ? s.noteComment : ''}`}>
                    {a.note}
                  </div>
                )}

                <Row gap={2} align="center" className={s.stageRow}>
                  <span className={s.stageLabel}>Stage:</span>
                  <StatusBadge status={a.stageAfter} />
                </Row>
              </div>
            );
          })}
        </div>
      )}
    </Stack>
  );
}
