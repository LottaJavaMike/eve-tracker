import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { formatDateTime } from '../utils/format.js';

const EMPTY_FORM = { project_id: '', title: '', notes: '', duration_minutes: '' };

export default function Activities() {
  const [activities, setActivities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    Promise.all([api.get('/api/activities'), api.get('/api/projects')])
      .then(([a, p]) => {
        setActivities(a);
        setProjects(p);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title) return;
    await api.post('/api/activities', {
      ...form,
      project_id: form.project_id ? Number(form.project_id) : null,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
    });
    setForm(EMPTY_FORM);
    load();
  }

  async function remove(id) {
    await api.del(`/api/activities/${id}`);
    load();
  }

  return (
    <div>
      <h2>Activity log</h2>

      <div className="card" style={{ marginBottom: 16 }}>
        <form className="form-grid" onSubmit={handleCreate}>
          <label style={{ gridColumn: '1 / -1' }}>
            What did you do?
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <label>
            Project (optional)
            <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
              <option value="">— None —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </label>
          <label>
            Duration (minutes)
            <input type="number" min="0" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            Notes
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </label>
          <div style={{ gridColumn: '1 / -1' }}>
            <button className="btn btn-primary" type="submit">Log activity</button>
          </div>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : activities.length === 0 ? (
          <p className="empty-state">Nothing logged yet.</p>
        ) : (
          activities.map((a) => (
            <div key={a.id} className="list-item">
              <div className="row">
                <strong>{a.title}</strong>
                <span className="muted">{formatDateTime(a.logged_at)}</span>
              </div>
              <p className="secondary">
                {a.project_title && <>{a.project_title}{a.notes ? ' · ' : ''}</>}
                {a.notes}
                {a.duration_minutes ? ` · ${a.duration_minutes} min` : ''}
              </p>
              <button className="btn btn-danger" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => remove(a.id)}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
