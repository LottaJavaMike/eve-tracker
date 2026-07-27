import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { formatDateTime, timeRemaining } from '../utils/format.js';
import StatusPill from '../components/StatusPill.jsx';

export default function PlanetaryInteraction() {
  const [colonies, setColonies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/planets').then(setColonies).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>Planetary Interaction</h2>
      <div className="card">
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : colonies.length === 0 ? (
          <p className="empty-state">
            No colonies synced yet. Connect a character on the Settings page and run a sync.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Planet</th>
                <th>Type</th>
                <th>Upgrade level</th>
                <th>Pins</th>
                <th>Extraction expires</th>
              </tr>
            </thead>
            <tbody>
              {colonies.map((c) => {
                const remaining = timeRemaining(c.expiry_date);
                return (
                  <tr key={c.id}>
                    <td>{c.planet_name || `Planet ${c.planet_id}`}</td>
                    <td className="secondary">{c.planet_type}</td>
                    <td className="secondary">{c.upgrade_level}</td>
                    <td className="secondary">{c.num_pins}</td>
                    <td>
                      {c.expiry_date ? (
                        <span className="row" style={{ justifyContent: 'flex-start', gap: 8 }}>
                          <StatusPill label={remaining.label} tone={remaining.tone} />
                          <span className="muted">{formatDateTime(c.expiry_date)}</span>
                        </span>
                      ) : (
                        <span className="muted">No active extraction</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
