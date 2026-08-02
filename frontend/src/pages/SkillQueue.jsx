import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { formatDateTime, timeRemaining } from '../utils/format.js';
import StatusPill from '../components/StatusPill.jsx';

export default function SkillQueue() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/skills').then(setQueue).finally(() => setLoading(false));
  }, []);

  const lastFinish = queue.length ? queue[queue.length - 1].finish_date : null;
  const totalRemaining = lastFinish ? timeRemaining(lastFinish) : null;

  return (
    <div>
      <div className="row">
        <h2>Skill Queue</h2>
        {!loading && totalRemaining && (
          <span className="secondary">
            Total queue time remaining: <StatusPill label={totalRemaining.label} tone={totalRemaining.tone} />
          </span>
        )}
      </div>
      <div className="card">
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : queue.length === 0 ? (
          <p className="empty-state">
            No skill queue synced yet. Connect a character on the Settings page and run a sync.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Skill</th>
                <th>Level</th>
                <th>Finishes</th>
                <th>Time left</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((s) => {
                const remaining = s.finish_date ? timeRemaining(s.finish_date) : null;
                return (
                  <tr key={s.id}>
                    <td className="secondary">{s.queue_position + 1}</td>
                    <td>{s.skill_name || `Type ${s.skill_id}`}</td>
                    <td className="secondary">{s.finished_level}</td>
                    <td className="secondary">{formatDateTime(s.finish_date)}</td>
                    <td>{remaining ? <StatusPill label={remaining.label} tone={remaining.tone} /> : <span className="muted">Queued</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
