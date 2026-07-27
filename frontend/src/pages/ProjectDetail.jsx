import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { formatDate, formatDateTime } from '../utils/format.js';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [noteForm, setNoteForm] = useState({ title: '', notes: '' });

  function load() {
    api.get(`/api/projects/${id}`).then(setProject);
  }

  useEffect(load, [id]);

  async function addActivity(e) {
    e.preventDefault();
    if (!noteForm.title) return;
    await api.post('/api/activities', { project_id: Number(id), ...noteForm });
    setNoteForm({ title: '', notes: '' });
    load();
  }

  async function remove() {
    if (!confirm(`Delete project "${project.title}"? This cannot be undone.`)) return;
    await api.del(`/api/projects/${id}`);
    navigate('/projects');
  }

  if (!project) return <p className="empty-state">Loading…</p>;

  return (
    <div>
      <Link to="/projects" className="secondary">&larr; Projects</Link>
      <div className="row" style={{ marginTop: 8 }}>
        <h2>{project.title}</h2>
        <button className="btn btn-danger" onClick={remove}>Delete project</button>
      </div>
      <p className="secondary">{project.description || 'No description.'}</p>
      <p className="secondary">
        {project.category} · {project.status} · priority {project.priority}
        {project.due_date && <> · due {formatDate(project.due_date)}</>}
      </p>

      <div className="two-col" style={{ marginTop: 20 }}>
        <div className="card">
          <h3>Activity log</h3>
          <form onSubmit={addActivity} style={{ marginBottom: 12 }}>
            <div className="form-grid">
              <label style={{ gridColumn: '1 / -1' }}>
                What did you do?
                <input value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} />
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                Notes
                <textarea rows={2} value={noteForm.notes} onChange={(e) => setNoteForm({ ...noteForm, notes: e.target.value })} />
              </label>
              <div style={{ gridColumn: '1 / -1' }}>
                <button className="btn btn-primary" type="submit">Log activity</button>
              </div>
            </div>
          </form>
          {project.activities.length === 0 ? (
            <p className="empty-state">No activity logged yet.</p>
          ) : (
            project.activities.map((a) => (
              <div key={a.id} className="list-item">
                <div className="row">
                  <strong>{a.title}</strong>
                  <span className="muted">{formatDateTime(a.logged_at)}</span>
                </div>
                {a.notes && <p className="secondary">{a.notes}</p>}
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3>Linked industry jobs</h3>
          {project.industryJobs.length === 0 ? (
            <p className="empty-state">No industry jobs linked. Link one from the Industry page.</p>
          ) : (
            project.industryJobs.map((j) => (
              <div key={j.id} className="list-item">
                <strong>{j.blueprint_name}</strong>
                <p className="secondary">{j.activity_type} · {j.status}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
