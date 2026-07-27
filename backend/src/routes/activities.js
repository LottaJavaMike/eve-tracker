import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const { project_id, limit = 100 } = req.query;
  let sql = `SELECT activities.*, projects.title AS project_title
             FROM activities LEFT JOIN projects ON projects.id = activities.project_id
             WHERE 1=1`;
  const params = [];
  if (project_id) {
    sql += ' AND activities.project_id = ?';
    params.push(project_id);
  }
  sql += ' ORDER BY logged_at DESC LIMIT ?';
  params.push(Number(limit));
  res.json(db.prepare(sql).all(...params));
});

router.post('/', (req, res) => {
  const { project_id = null, title, notes = null, logged_at = null, duration_minutes = null } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const info = db
    .prepare(
      `INSERT INTO activities (project_id, title, notes, logged_at, duration_minutes)
       VALUES (?, ?, ?, COALESCE(?, datetime('now')), ?)`
    )
    .run(project_id, title, notes, logged_at, duration_minutes);
  if (project_id) {
    db.prepare(`UPDATE projects SET updated_at = datetime('now') WHERE id = ?`).run(project_id);
  }
  res.status(201).json(db.prepare('SELECT * FROM activities WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Activity not found' });
  const merged = { ...existing, ...req.body };
  db.prepare(
    `UPDATE activities SET project_id = ?, title = ?, notes = ?, logged_at = ?, duration_minutes = ? WHERE id = ?`
  ).run(merged.project_id, merged.title, merged.notes, merged.logged_at, merged.duration_minutes, req.params.id);
  res.json(db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM activities WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
