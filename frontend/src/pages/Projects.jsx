import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { formatDate } from '../utils/format.js';

const EMPTY_FORM = { title: '', description: '', category: 'general', status: 'planned', priority: 'normal', due_date: '' };

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  function load() {
    setLoading(true);
    api.get('/api/projects').then(setProjects).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    await api.post('/api/projects', { ...form, due_date: form.due_date || null });
    setForm(EMPTY_FORM);
    setShowForm(false);
    load();
  }

  async function updateStatus(project, status) {
    await api.put(`/api/projects/${project.id}`, { status });
    load();
  }

  return (
    <div>
      <div className="row">
        <h2>Projects</h2>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ New project'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <form className="form-grid" onSubmit={handleCreate}>
            <label style={{ gridColumn: '1 / -1' }}>
              Title
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              Description
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <label>
              Category
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="general">General</option>
                <option value="industry">Industry</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              Priority
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="on_hold">On hold</option>
                <option value="done">Done</option>
              </select>
            </label>
            <label>
              Due date
              <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </label>
            <div style={{ gridColumn: '1 / -1' }}>
              <button className="btn btn-primary" type="submit">Create project</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : projects.length === 0 ? (
          <p className="empty-state">No projects yet. Create one to get started.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td><Link to={`/projects/${p.id}`}>{p.title}</Link></td>
                  <td className="secondary">{p.category}</td>
                  <td className="secondary">{p.priority}</td>
                  <td className="secondary">{formatDate(p.due_date)}</td>
                  <td>
                    <select
                      value={p.status}
                      onChange={(e) => updateStatus(p, e.target.value)}
                      style={{ border: 'none', background: 'transparent', color: 'inherit', fontWeight: 600 }}
                    >
                      <option value="planned">Planned</option>
                      <option value="active">Active</option>
                      <option value="on_hold">On hold</option>
                      <option value="done">Done</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
