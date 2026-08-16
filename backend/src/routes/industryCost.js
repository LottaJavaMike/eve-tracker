import { Router } from 'express';
import { computeIndustryCost } from '../services/industryCost.js';

const router = Router();

router.get('/', async (req, res) => {
  const { blueprintTypeId, me = 10, runs = 1, hub = 'jita' } = req.query;
  if (!blueprintTypeId) return res.status(400).json({ error: 'blueprintTypeId is required' });
  try {
    const result = await computeIndustryCost({
      blueprintTypeId: Number(blueprintTypeId),
      me: Number(me),
      runs: Number(runs),
      hub,
    });
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err.message || 'Failed to compute industry cost' });
  }
});

export default router;
