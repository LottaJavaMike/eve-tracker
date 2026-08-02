import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM skill_queue ORDER BY queue_position ASC').all());
});

export default router;
