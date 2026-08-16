import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { formatDateTime } from '../utils/format.js';
import IndustryCostModal from '../components/IndustryCostModal.jsx';

export default function Blueprints() {
  const [blueprints, setBlueprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [costTarget, setCostTarget] = useState(null);

  useEffect(() => {
    api.get('/api/blueprints').then(setBlueprints).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>Blueprint Library</h2>
      <div className="card">
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : blueprints.length === 0 ? (
          <p className="empty-state">
            No blueprints synced yet. Connect a character on the Settings page and run a sync.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Blueprint</th>
                <th>Type</th>
                <th>ME</th>
                <th>TE</th>
                <th>Qty</th>
                <th>Location</th>
                <th>Synced</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {blueprints.map((bp) => (
                <tr key={bp.id}>
                  <td>{bp.type_name || `Type ${bp.type_id}`}</td>
                  <td className="secondary">{bp.is_bpo ? 'BPO' : 'BPC'}</td>
                  <td className="secondary">{bp.material_efficiency}</td>
                  <td className="secondary">{bp.time_efficiency}</td>
                  <td className="secondary">{bp.quantity > 0 ? bp.quantity : 1}</td>
                  <td className="secondary">{bp.location_name}</td>
                  <td className="secondary">{formatDateTime(bp.synced_at)}</td>
                  <td>
                    <button className="link-button" onClick={() => setCostTarget(bp)}>Calculate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {costTarget && (
        <IndustryCostModal
          blueprintTypeId={costTarget.type_id}
          blueprintName={costTarget.type_name || `Type ${costTarget.type_id}`}
          defaultRuns={1}
          defaultMe={costTarget.material_efficiency}
          onClose={() => setCostTarget(null)}
        />
      )}
    </div>
  );
}
