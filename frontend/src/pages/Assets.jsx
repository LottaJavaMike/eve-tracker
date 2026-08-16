import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { formatDateTime, formatIsk } from '../utils/format.js';
import Modal from '../components/Modal.jsx';

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [description, setDescription] = useState(null);
  const [descriptionLoading, setDescriptionLoading] = useState(false);

  useEffect(() => {
    api.get('/api/assets').then(setAssets).finally(() => setLoading(false));
  }, []);

  function openDescription(asset) {
    setSelectedType(asset);
    setDescription(null);
    setDescriptionLoading(true);
    api
      .get(`/api/assets/types/${asset.type_id}/description`)
      .then(setDescription)
      .finally(() => setDescriptionLoading(false));
  }

  const totalValue = assets.reduce((sum, a) => sum + (a.total_value || 0), 0);

  return (
    <div>
      <div className="row">
        <h2>Assets</h2>
        {!loading && assets.length > 0 && (
          <span className="secondary">Total value: <strong>{formatIsk(totalValue)}</strong></span>
        )}
      </div>
      <div className="card">
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : assets.length === 0 ? (
          <p className="empty-state">
            No assets synced yet. Connect a character on the Settings page and run a sync.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Location</th>
                <th>Flag</th>
                <th>Unit Value</th>
                <th>Total Value</th>
                <th>Synced</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id}>
                  <td>
                    <button className="link-button" onClick={() => openDescription(a)}>
                      {a.type_name || `Type ${a.type_id}`}
                    </button>
                  </td>
                  <td className="secondary">{a.quantity}</td>
                  <td className="secondary">{a.location_name || `Location ${a.location_id}`}</td>
                  <td className="secondary">{a.location_flag}</td>
                  <td className="secondary">{formatIsk(a.unit_price)}</td>
                  <td className="secondary">{formatIsk(a.total_value)}</td>
                  <td className="secondary">{formatDateTime(a.synced_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selectedType && (
        <Modal title={selectedType.type_name || `Type ${selectedType.type_id}`} onClose={() => setSelectedType(null)}>
          {descriptionLoading ? (
            <p className="empty-state">Loading…</p>
          ) : description?.description ? (
            <p className="item-description">{description.description}</p>
          ) : (
            <p className="empty-state">No description available for this item.</p>
          )}
        </Modal>
      )}
    </div>
  );
}
