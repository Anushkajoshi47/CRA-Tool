import React, { useState } from 'react';
import { createReport, updateReport } from '../api/vmApi';
import { computeDeadlines } from '../utils/clockCalculations';

const TYPE_LABELS = {
  initial:  '24h Initial Report (Early Warning)',
  detailed: '72h Detailed Report',
  final:    'Final Report',
};

export default function ReportForm({ ticket, existingReport, onSaved, onCancel }: any) {
  const [type, setType]       = useState(existingReport?.type || 'initial');
  const [content, setContent] = useState(existingReport?.content || '');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const deadlines = computeDeadlines(ticket.clockStartedAt, ticket.mitigationDeployedAt, ticket.isIncident);
  const dueAt     = { initial: deadlines.initial, detailed: deadlines.detailed, final: deadlines.final }[type];

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (existingReport) {
        await updateReport(existingReport._id, { content });
      } else {
        await createReport({ ticketId: ticket._id, type, content });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save report');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
      {!existingReport && (
        <div>
          <label className="label">Report Type</label>
          <select className="input" value={type} onChange={e => setType(e.target.value)}>
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      )}

      {dueAt && (
        <div style={{
          fontSize: 12, color: 'var(--text-2)',
          padding: '8px 12px',
          background: 'rgba(245,158,11,0.07)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(245,158,11,0.2)',
        }}>
          Due: {new Date(dueAt).toLocaleString()}
        </div>
      )}

      <div>
        <label className="label">Content</label>
        <textarea
          className="input"
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={8}
          placeholder="Report content — findings, authority contact details, reference numbers, actions taken..."
          style={{ resize: 'vertical' }}
          required
        />
      </div>

      {error && <div style={{ color: '#f87171', fontSize: 13 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving…' : existingReport ? 'Update Report' : 'Create Report'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
