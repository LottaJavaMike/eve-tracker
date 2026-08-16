import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { formatDateTime, formatIsk, timeRemaining } from '../utils/format.js';
import StatusPill from '../components/StatusPill.jsx';
import IndustryCostModal from '../components/IndustryCostModal.jsx';

const EMPTY_FORM = {
  activity_type: 'manufacturing', blueprint_name: '', output_name: '', runs: 1,
  status: 'in_progress', start_date: '', end_date: '', facility_name: '', cost: '', project_id: '',
};

export default function Industry() {
  const [jobs, setJobs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [costTarget, setCostTarget] = useState(null);

  function load() {
    setLoading(true);
    Promise.all([api.get('/api/industry'), api.get('/api/projects')])
      .then(([j, p]) => {
        setJobs(j);
        setProjects(p);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.blueprint_name) return;
    await api.post('/api/industry', {
      ...form,
      runs: Number(form.runs) || 1,
      cost: form.cost ? Number(form.cost) : null,
      project_id: form.project_id ? Number(form.project_id) : null,
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
    load();
  }

  async function linkProject(job, projectId) {
    await api.put(`/api/industry/${job.id}`, { project_id: projectId ? Number(projectId) : null });
    load();
  }

  async function syncNow() {
    setSyncing(true);
    try {
      await api.post('/api/sync/now', {});
    } finally {
      setSyncing(false);
      load();
    }
  }

  return (
    <div>
      <div className="row">
        <h2>Industry &amp; Production</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={syncNow} disabled={syncing}>{syncing ? 'Syncing…' : 'Sync from ESI'}</button>
          <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : '+ Log manual job'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <form className="form-grid" onSubmit={handleCreate}>
            <label>
              Blueprint / job name
              <input required value={form.blueprint_name} onChange={(e) => setForm({ ...form, blueprint_name: e.target.value })} />
            </label>
            <label>
              Output
              <input value={form.output_name} onChange={(e) => setForm({ ...form, output_name: e.target.value })} />
            </label>
            <label>
              Activity type
              <select value={form.activity_type} onChange={(e) => setForm({ ...form, activity_type: e.target.value })}>
                <option value="manufacturing">Manufacturing</option>
                <option value="reaction">Reaction</option>
                <option value="invention">Invention</option>
                <option value="copying">Copying</option>
                <option value="material_efficiency_research">ME research</option>
                <option value="time_efficiency_research">TE research</option>
              </select>
            </label>
            <label>
              Runs
              <input type="number" min="1" value={form.runs} onChange={(e) => setForm({ ...form, runs: e.target.value })} />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="in_progress">In progress</option>
                <option value="ready">Ready</option>
                <option value="delivered">Delivered</option>
              </select>
            </label>
            <label>
              Facility
              <input value={form.facility_name} onChange={(e) => setForm({ ...form, facility_name: e.target.value })} />
            </label>
            <label>
              End date/time
              <input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </label>
            <label>
              Cost (ISK)
              <input type="number" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            </label>
            <label>
              Link to project
              <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
                <option value="">— None —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </label>
            <div style={{ gridColumn: '1 / -1' }}>
              <button className="btn btn-primary" type="submit">Save job</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : jobs.length === 0 ? (
          <p className="empty-state">No industry jobs yet. Connect a character and sync, or log one manually.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Blueprint</th>
                <th>Output</th>
                <th>Type</th>
                <th>Runs</th>
                <th>Ends</th>
                <th>Time left</th>
                <th>Cost</th>
                <th>Project</th>
                <th>Source</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => {
                const remaining = j.status === 'in_progress' ? timeRemaining(j.end_date) : null;
                return (
                  <tr key={j.id}>
                    <td>{j.blueprint_name}</td>
                    <td className="secondary">{j.output_name || '—'}</td>
                    <td className="secondary">{j.activity_type}</td>
                    <td className="secondary">{j.runs}</td>
                    <td className="secondary">{formatDateTime(j.end_date)}</td>
                    <td>{remaining ? <StatusPill label={remaining.label} tone={remaining.tone} /> : <span className="muted">{j.status}</span>}</td>
                    <td className="secondary">{formatIsk(j.cost)}</td>
                    <td>
                      <select
                        value={j.project_id ?? ''}
                        onChange={(e) => linkProject(j, e.target.value)}
                        style={{ border: 'none', background: 'transparent', color: 'inherit' }}
                      >
                        <option value="">— None —</option>
                        {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                      </select>
                    </td>
                    <td className="secondary">{j.source}</td>
                    <td>
                      {j.blueprint_type_id && (
                        <button className="link-button" onClick={() => setCostTarget(j)}>Calculate</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {costTarget && (
        <IndustryCostModal
          blueprintTypeId={costTarget.blueprint_type_id}
          blueprintName={costTarget.blueprint_name}
          defaultRuns={costTarget.runs}
          onClose={() => setCostTarget(null)}
        />
      )}
    </div>
  );
}
