import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { esi } from '../esi/client.js';
import { generatePkce, buildAuthorizeUrl, exchangeCode, decodeAccessToken } from '../esi/sso.js';
import { getCharacterRow } from '../esi/token.js';
import { runFullSync } from '../jobs/syncScheduler.js';

const router = Router();

const pendingAuth = new Map(); // state -> { verifier, createdAt }

router.get('/login', (req, res) => {
  const clientId = process.env.ESI_CLIENT_ID;
  const redirectUri = process.env.ESI_CALLBACK_URL;
  if (!clientId || !redirectUri) {
    return res.status(500).send('ESI_CLIENT_ID / ESI_CALLBACK_URL not configured in backend/.env');
  }
  const { verifier, challenge } = generatePkce();
  const state = crypto.randomBytes(16).toString('hex');
  pendingAuth.set(state, { verifier, createdAt: Date.now() });

  const url = buildAuthorizeUrl({ state, codeChallenge: challenge, clientId, redirectUri });
  res.redirect(url);
});

router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  const pending = pendingAuth.get(state);
  pendingAuth.delete(state);
  if (!pending || !code) {
    return res.status(400).send('Invalid or expired login attempt. Please try connecting again.');
  }

  try {
    const tokens = await exchangeCode({
      code,
      verifier: pending.verifier,
      clientId: process.env.ESI_CLIENT_ID,
      clientSecret: process.env.ESI_CLIENT_SECRET,
    });
    const { characterId, name, scopes } = decodeAccessToken(tokens.access_token);

    const { data: charInfo } = await esi.get(`/characters/${characterId}/`);
    let corporationName = null;
    try {
      const { data: corpInfo } = await esi.get(`/corporations/${charInfo.corporation_id}/`);
      corporationName = corpInfo.name;
    } catch {
      // non-fatal
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    const portraitUrl = `https://images.evetech.net/characters/${characterId}/portrait?size=256`;

    db.prepare(
      `INSERT INTO character (character_id, name, corporation_id, corporation_name, portrait_url, access_token, refresh_token, token_expires_at, scopes, connected_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(character_id) DO UPDATE SET
         name = excluded.name,
         corporation_id = excluded.corporation_id,
         corporation_name = excluded.corporation_name,
         portrait_url = excluded.portrait_url,
         access_token = excluded.access_token,
         refresh_token = excluded.refresh_token,
         token_expires_at = excluded.token_expires_at,
         scopes = excluded.scopes,
         connected_at = datetime('now')`
    ).run(
      characterId,
      name,
      charInfo.corporation_id,
      corporationName,
      portraitUrl,
      tokens.access_token,
      tokens.refresh_token,
      expiresAt,
      Array.isArray(scopes) ? scopes.join(' ') : String(scopes ?? '')
    );

    runFullSync().catch((err) => console.error('Post-login sync failed:', err.message));

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/settings?connected=1`);
  } catch (err) {
    console.error('SSO callback failed:', err.response?.data || err.message);
    res.status(500).send('Failed to complete EVE SSO login. Check backend logs.');
  }
});

router.get('/status', (req, res) => {
  const char = getCharacterRow();
  if (!char) return res.json({ connected: false });
  res.json({
    connected: true,
    characterId: char.character_id,
    name: char.name,
    corporationName: char.corporation_name,
    portraitUrl: char.portrait_url,
    scopes: char.scopes?.split(' ') ?? [],
    connectedAt: char.connected_at,
  });
});

router.post('/logout', (req, res) => {
  db.prepare('DELETE FROM character').run();
  res.json({ ok: true });
});

export default router;
