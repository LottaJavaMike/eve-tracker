import { Router } from 'express';
import { db } from '../db.js';
import { esi } from '../esi/client.js';

const router = Router();

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM assets ORDER BY total_value DESC').all());
});

const typeDescriptionCache = new Map();

router.get('/types/:typeId/description', async (req, res) => {
  const typeId = Number(req.params.typeId);
  if (typeDescriptionCache.has(typeId)) {
    return res.json(typeDescriptionCache.get(typeId));
  }
  try {
    const { data } = await esi.get(`/universe/types/${typeId}/`);
    const description = (data.description || '').replace(/<[^>]*>/g, '');
    const result = { type_id: typeId, name: data.name, description };
    typeDescriptionCache.set(typeId, result);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch item description from ESI' });
  }
});

export default router;
