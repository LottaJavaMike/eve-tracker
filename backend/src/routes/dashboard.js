import { Router } from 'express';
import { db } from '../db.js';
import { getCharacterRow } from '../esi/token.js';

const router = Router();

router.get('/', (req, res) => {
  const char = getCharacterRow();

  const projectCounts = db
    .prepare('SELECT status, COUNT(*) AS count FROM projects GROUP BY status')
    .all();

  const activeProjects = db
    .prepare(`SELECT * FROM projects WHERE status = 'active' ORDER BY updated_at DESC LIMIT 5`)
    .all();

  const recentActivities = db
    .prepare(
      `SELECT activities.*, projects.title AS project_title
       FROM activities LEFT JOIN projects ON projects.id = activities.project_id
       ORDER BY logged_at DESC LIMIT 8`
    )
    .all();

  const industryJobsInProgress = db
    .prepare(`SELECT * FROM industry_jobs WHERE status = 'in_progress' ORDER BY end_date ASC`)
    .all();

  const blueprintCount = db.prepare('SELECT COUNT(*) AS count FROM blueprints').get().count;
  const bpoCount = db.prepare('SELECT COUNT(*) AS count FROM blueprints WHERE is_bpo = 1').get().count;

  const piColonies = db.prepare('SELECT * FROM pi_colonies ORDER BY expiry_date ASC').all();

  const walletHistory = db
    .prepare('SELECT balance, captured_at FROM wallet_snapshots ORDER BY captured_at ASC LIMIT 200')
    .all();
  const walletBalance = walletHistory.length ? walletHistory[walletHistory.length - 1].balance : null;

  res.json({
    character: char
      ? {
          characterId: char.character_id,
          name: char.name,
          corporationName: char.corporation_name,
          portraitUrl: char.portrait_url,
          connected: true,
        }
      : { connected: false },
    projectCounts,
    activeProjects,
    recentActivities,
    industryJobsInProgress,
    blueprintCount,
    bpoCount,
    piColonies,
    walletBalance,
    walletHistory,
  });
});

export default router;
