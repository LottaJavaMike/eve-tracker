import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { formatIsk } from '../utils/format.js';
import Modal from './Modal.jsx';
import StatusPill from './StatusPill.jsx';

const HUBS = [
  { value: 'jita', label: 'Jita' },
  { value: 'amarr', label: 'Amarr' },
  { value: 'dodixie', label: 'Dodixie' },
  { value: 'rens', label: 'Rens' },
  { value: 'hek', label: 'Hek' },
];

export default function IndustryCostModal({ blueprintTypeId, blueprintName, defaultRuns, defaultMe, onClose }) {
  const [runs, setRuns] = useState(defaultRuns || 1);
  const [me, setMe] = useState(defaultMe ?? 10);
  const [hub, setHub] = useState('jita');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get(`/api/industry-cost?blueprintTypeId=${blueprintTypeId}&me=${me}&runs=${runs}&hub=${hub}`)
      .then(setResult)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [blueprintTypeId, me, runs, hub]);

  const marginTone = result?.margin_isk > 0 ? 'good' : 'critical';

  return (
    <Modal title={blueprintName} onClose={onClose}>
      <div className="form-grid" style={{ marginBottom: 14 }}>
        <label>
          Runs
          <input type="number" min="1" value={runs} onChange={(e) => setRuns(Number(e.target.value) || 1)} />
        </label>
        <label>
          ME
          <input type="number" min="0" max="10" value={me} onChange={(e) => setMe(Number(e.target.value) || 0)} />
        </label>
        <label>
          Hub
          <select value={hub} onChange={(e) => setHub(e.target.value)}>
            {HUBS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="empty-state">Calculating…</p>
      ) : error ? (
        <p className="empty-state">Failed to calculate: {error}</p>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-tile">
              <div className="value">{formatIsk(result.build_cost)}</div>
              <div className="label">Build cost</div>
            </div>
            <div className="stat-tile">
              <div className="value">{formatIsk(result.revenue)}</div>
              <div className="label">Expected revenue</div>
            </div>
            <div className="stat-tile">
              <div className="value">{formatIsk(result.margin_isk)}</div>
              <div className="label">
                Margin{' '}
                {result.margin_pct !== null && (
                  <StatusPill label={`${result.margin_pct.toFixed(1)}%`} tone={marginTone} />
                )}
              </div>
            </div>
          </div>

          <p className="secondary" style={{ fontSize: 13 }}>
            System cost index: {result.cost_index_pct.toFixed(2)}%
            {result.cost_index_note && <span className="muted"> — {result.cost_index_note}</span>}
          </p>

          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Qty</th>
                <th>Unit price</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {result.materials.map((m) => (
                <tr key={m.type_id}>
                  <td>{m.name || `Type ${m.type_id}`}</td>
                  <td className="secondary">{m.quantity.toLocaleString()}</td>
                  <td className="secondary">{formatIsk(m.unit_price)}</td>
                  <td className="secondary">{formatIsk(m.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="muted" style={{ fontSize: 11, marginTop: 10 }}>
            Materials priced at hub sell median; product priced at hub buy median. Job cost approximated as
            cost index × material cost.
          </p>
        </>
      )}
    </Modal>
  );
}
