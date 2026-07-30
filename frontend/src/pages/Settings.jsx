import { useEffect, useState } from 'react';
import { api, authLoginUrl } from '../api/client.js';
import { formatDateTime } from '../utils/format.js';

export default function Settings() {
  const [status, setStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  function load() {
    api.get('/auth/status').then(setStatus);
  }

  useEffect(load, []);

  async function disconnect() {
    if (!confirm('Disconnect this character? Synced ESI data stays in the database.')) return;
    await api.post('/auth/logout', {});
    load();
  }

  async function syncNow() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await api.post('/api/sync/now', {});
      setSyncResult(result);
    } catch (err) {
      setSyncResult({ ok: false, error: err.message });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div>
      <h2>Settings</h2>

      <div className="card">
        <h3>EVE character connection</h3>
        {!status ? (
          <p className="empty-state">Loading…</p>
        ) : status.connected ? (
          <>
            <div className="row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={status.portraitUrl} alt="" width={56} height={56} style={{ borderRadius: 8 }} />
                <div>
                  <strong>{status.name}</strong>
                  <p className="secondary" style={{ margin: 0 }}>{status.corporationName}</p>
                  {status.currentSystemName && (
                    <p className="secondary" style={{ margin: 0 }}>{status.currentSystemName}</p>
                  )}
                </div>
              </div>
              <button className="btn btn-danger" onClick={disconnect}>Disconnect</button>
            </div>
            <p className="secondary" style={{ marginTop: 12 }}>Connected {formatDateTime(status.connectedAt)}</p>
            <p className="secondary">Scopes granted:</p>
            <ul className="secondary">
              {status.scopes.map((s) => <li key={s}>{s}</li>)}
            </ul>
            <button className="btn btn-primary" onClick={syncNow} disabled={syncing}>
              {syncing ? 'Syncing…' : 'Sync now'}
            </button>
            {syncResult && (
              <pre style={{ marginTop: 10, fontSize: 12, background: 'var(--page-plane)', padding: 8, borderRadius: 6 }}>
                {JSON.stringify(syncResult, null, 2)}
              </pre>
            )}
          </>
        ) : (
          <>
            <p className="secondary">
              No character connected. Connecting lets the dashboard pull live industry jobs, blueprints,
              planetary interaction, and wallet data via EVE's ESI API.
            </p>
            <a className="btn btn-primary" href={authLoginUrl} style={{ textDecoration: 'none', display: 'inline-block' }}>
              Connect character via EVE SSO
            </a>
            <p className="muted" style={{ marginTop: 12, fontSize: 12 }}>
              Requires an application registered at developers.eveonline.com with client ID/secret set in{' '}
              <code>backend/.env</code>. See the README for setup steps.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
