import crypto from 'node:crypto';
import axios from 'axios';

const SSO_BASE = 'https://login.eveonline.com';
export const SCOPES = [
  'esi-industry.read_character_jobs.v1',
  'esi-characters.read_blueprints.v1',
  'esi-assets.read_assets.v1',
  'esi-planets.manage_planets.v1',
  'esi-wallet.read_character_wallet.v1',
  'esi-location.read_location.v1',
].join(' ');

function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function generatePkce() {
  const verifier = base64url(crypto.randomBytes(32));
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

export function buildAuthorizeUrl({ state, codeChallenge, clientId, redirectUri }) {
  const url = new URL('/v2/oauth/authorize/', SSO_BASE);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('scope', SCOPES);
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url.toString();
}

async function tokenRequest(body, clientId, clientSecret) {
  const params = { ...body };
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

  // Client identity goes either in the Basic auth header OR the body, never both —
  // EVE's token endpoint rejects the request if it's present in both places.
  if (clientSecret) {
    headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
  } else {
    params.client_id = clientId;
  }

  const res = await axios.post(`${SSO_BASE}/v2/oauth/token`, new URLSearchParams(params), { headers });
  return res.data;
}

export function exchangeCode({ code, verifier, clientId, clientSecret }) {
  return tokenRequest({ grant_type: 'authorization_code', code, code_verifier: verifier }, clientId, clientSecret);
}

export function refreshAccessToken({ refreshToken, clientId, clientSecret }) {
  return tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshToken }, clientId, clientSecret);
}

export function decodeAccessToken(accessToken) {
  const payload = accessToken.split('.')[1];
  const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  const characterId = Number(json.sub.split(':')[2]);
  return { characterId, name: json.name, scopes: json.scp };
}
