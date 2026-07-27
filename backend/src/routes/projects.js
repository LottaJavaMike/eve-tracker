import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const { status, category } = req.query;
  let sql = 'SELECT * FROM projects WHERE 1=1';
  const params = [];
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  sql += ' ORDER BY updated_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.get('/:id', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const activities = db
    .prepare('SELECT * FROM activities WHERE project_id = ? ORDER BY logged_at DESC')
    .all(req.params.id);
  const industryJobs = db
    .prepare('SELECT * FROM industry_jobs WHERE project_id = ? ORDER BY start_date DESC')
    .all(req.params.id);
  res.json({ ...project, activities, industryJobs });
});

router.post('/', (req, res) => {
  const { title, description = null, category = 'general', status = 'planned', priority = 'normal', start_date = null, due_date = null } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const info = db
    .prepare(
      `INSERT INTO projects (title, description, category, status, priority, start_date, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(title, description, category, status, priority, start_date, due_date);
  res.status(201).json(db.prepare('SELECT * FROM projects WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  const merged = { ...existing, ...req.body };
  const completedAt =
    merged.status === 'done' && existing.status !== 'done'
      ? new Date().toISOString()
      : merged.status !== 'done'
      ? null
      : existing.completed_at;

  db.prepare(
    `UPDATE projects SET title = ?, description = ?, category = ?, status = ?, priority = ?,
       start_date = ?, due_date = ?, completed_at = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    merged.title,
    merged.description,
    merged.category,
    merged.status,
    merged.priority,
    merged.start_date,
    merged.due_date,
    completedAt,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
