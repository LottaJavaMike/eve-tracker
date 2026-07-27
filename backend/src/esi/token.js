import { db } from '../db.js';
import { refreshAccessToken } from './sso.js';

export function getCharacterRow() {
  return db.prepare('SELECT * FROM character ORDER BY id DESC LIMIT 1').get();
}

export async function getValidAccessToken() {
  const char = getCharacterRow();
  if (!char || !char.refresh_token) return null;

  const expiresAt = new Date(char.token_expires_at).getTime();
  if (Date.now() < expiresAt - 60_000) {
    return char.access_token;
  }

  const tokens = await refreshAccessToken({
    refreshToken: char.refresh_token,
    clientId: process.env.ESI_CLIENT_ID,
    clientSecret: process.env.ESI_CLIENT_SECRET,
  });

  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  db.prepare(
    `UPDATE character SET access_token = ?, refresh_token = ?, token_expires_at = ? WHERE id = ?`
  ).run(tokens.access_token, tokens.refresh_token ?? char.refresh_token, newExpiresAt, char.id);

  return tokens.access_token;
}
