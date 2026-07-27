import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM industry_jobs WHERE 1=1';
  const params = [];
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  sql += ' ORDER BY end_date DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/', (req, res) => {
  const {
    activity_type, blueprint_name, output_name, runs = 1, status = 'in_progress',
    start_date = null, end_date = null, facility_name = null, cost = null, project_id = null,
  } = req.body;
  if (!blueprint_name) return res.status(400).json({ error: 'blueprint_name is required' });
  const info = db
    .prepare(
      `INSERT INTO industry_jobs (activity_type, blueprint_name, output_name, runs, status, start_date, end_date, facility_name, cost, project_id, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')`
    )
    .run(activity_type, blueprint_name, output_name, runs, status, start_date, end_date, facility_name, cost, project_id);
  res.status(201).json(db.prepare('SELECT * FROM industry_jobs WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM industry_jobs WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Job not found' });
  const merged = { ...existing, ...req.body };
  db.prepare(
    `UPDATE industry_jobs SET activity_type = ?, blueprint_name = ?, output_name = ?, runs = ?, status = ?,
       start_date = ?, end_date = ?, facility_name = ?, cost = ?, project_id = ? WHERE id = ?`
  ).run(
    merged.activity_type, merged.blueprint_name, merged.output_name, merged.runs, merged.status,
    merged.start_date, merged.end_date, merged.facility_name, merged.cost, merged.project_id, req.params.id
  );
  res.json(db.prepare('SELECT * FROM industry_jobs WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM industry_jobs WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
