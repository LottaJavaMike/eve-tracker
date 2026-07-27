import { Router } from 'express';
import { runFullSync } from '../jobs/syncScheduler.js';

const router = Router();

router.post('/now', async (req, res) => {
  try {
    const result = await runFullSync();
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
