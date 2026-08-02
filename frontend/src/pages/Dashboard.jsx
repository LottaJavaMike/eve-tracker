import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api/client.js';
import StatTile from '../components/StatTile.jsx';
import StatusPill from '../components/StatusPill.jsx';
import { formatDateTime, formatIsk, timeRemaining } from '../utils/format.js';

const STATUS_LABEL = { planned: 'Planned', active: 'Active', on_hold: 'On hold', done: 'Done' };
const STATUS_VAR = { planned: '--series-1', active: '--series-3', on_hold: '--series-4', done: '--series-6' };

function WalletTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: '6px 10px' }}>
      <div className="muted" style={{ fontSize: 11 }}>{new Date(label).toLocaleString()}</div>
      <div style={{ fontWeight: 600 }}>{formatIsk(payload[0].value)}</div>
    </div>
  );
}

function ProjectStatusBreakdown({ counts }) {
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c.count]));
  const max = Math.max(1, ...counts.map((c) => c.count));
  const statuses = ['planned', 'active', 'on_hold', 'done'];

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Projects by status</h3>
      {counts.length === 0 ? (
        <p className="empty-state">No projects yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {statuses.map((s) => {
            const count = byStatus[s] || 0;
            return (
              <div key={s}>
                <div className="row" style={{ marginBottom: 4 }}>
                  <span className="secondary" style={{ fontSize: 13 }}>{STATUS_LABEL[s]}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{count}</span>
                </div>
                <div style={{ background: 'var(--gridline)', borderRadius: 4, height: 8 }}>
                  <div
                    style={{
                      width: `${(count / max) * 100}%`,
                      background: `var(${STATUS_VAR[s]})`,
                      height: 8,
                      borderRadius: 4,
                      minWidth: count ? 8 : 0,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/api/dashboard').then(setData);
  }, []);

  if (!data) return <p className="empty-state">Loading…</p>;

  const upcomingExtractions = data.piColonies.filter((c) => {
    if (!c.expiry_date) return false;
    const hours = (new Date(c.expiry_date).getTime() - Date.now()) / 36e5;
    return hours < 48;
  }).length;

  const skillQueueRemaining = data.skillQueueFinish ? timeRemaining(data.skillQueueFinish) : null;

  const walletData = data.walletHistory.map((w) => ({
    time: new Date(w.captured_at.replace(' ', 'T') + 'Z').getTime(),
    balance: w.balance,
  }));

  return (
    <div>
      <div className="row">
        <h2>Dashboard</h2>
        {data.character.connected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={data.character.portraitUrl} alt="" width={36} height={36} style={{ borderRadius: 6 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{data.character.name}</div>
              <div className="muted" style={{ fontSize: 11 }}>{data.character.corporationName}</div>
              {data.character.currentSystemName && (
                <div className="muted" style={{ fontSize: 11 }}>{data.character.currentSystemName}</div>
              )}
            </div>
          </div>
        ) : (
          <Link to="/settings" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Connect character
          </Link>
        )}
      </div>

      <div className="stat-grid">
        <StatTile label="Active projects" value={data.activeProjects.length} />
        <StatTile label="Jobs in progress" value={data.industryJobsInProgress.length} />
        <StatTile label="Blueprints owned" value={data.blueprintCount} />
        <StatTile label="BPOs" value={data.bpoCount} />
        <StatTile label="Assets value" value={formatIsk(data.assetsTotalValue)} />
        <StatTile label="PI extractions <48h" value={upcomingExtractions} />
        <StatTile label="Wallet balance" value={data.walletBalance !== null ? formatIsk(data.walletBalance) : '—'} />
      </div>

      <div className="two-col">
        <div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Industry jobs in progress</h3>
            {data.industryJobsInProgress.length === 0 ? (
              <p className="empty-state">Nothing running right now.</p>
            ) : (
              <table>
                <thead>
                  <tr><th>Blueprint</th><th>Output</th><th>Ends</th><th>Time left</th></tr>
                </thead>
                <tbody>
                  {data.industryJobsInProgress.slice(0, 8).map((j) => {
                    const remaining = timeRemaining(j.end_date);
                    return (
                      <tr key={j.id}>
                        <td>{j.blueprint_name}</td>
                        <td className="secondary">{j.output_name || '—'}</td>
                        <td className="secondary">{formatDateTime(j.end_date)}</td>
                        <td><StatusPill label={remaining.label} tone={remaining.tone} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Recent activity</h3>
            {data.recentActivities.length === 0 ? (
              <p className="empty-state">No activity logged yet.</p>
            ) : (
              data.recentActivities.map((a) => (
                <div key={a.id} className="list-item">
                  <div className="row">
                    <strong>{a.title}</strong>
                    <span className="muted">{formatDateTime(a.logged_at)}</span>
                  </div>
                  {a.project_title && <p className="secondary" style={{ margin: 0 }}>{a.project_title}</p>}
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <ProjectStatusBreakdown counts={data.projectCounts} />

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Wallet balance</h3>
            {walletData.length < 2 ? (
              <p className="empty-state">Not enough wallet history yet — sync a few times to build a trend.</p>
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={walletData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="walletFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--gridline)" vertical={false} />
                  <XAxis
                    dataKey="time"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(t) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    stroke="var(--baseline)"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  />
                  <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip content={<WalletTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="var(--series-1)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    fill="url(#walletFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Skill queue</h3>
            <div className="list-item row">
              <span>Skills in queue</span>
              <span style={{ fontWeight: 600 }}>{data.skillQueueCount}</span>
            </div>
            <div className="list-item row">
              <span>Time remaining</span>
              {skillQueueRemaining ? (
                <StatusPill label={skillQueueRemaining.label} tone={skillQueueRemaining.tone} />
              ) : (
                <span className="muted">—</span>
              )}
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>PI extraction timers</h3>
            {data.piColonies.filter((c) => c.expiry_date).length === 0 ? (
              <p className="empty-state">No active extractions.</p>
            ) : (
              data.piColonies.filter((c) => c.expiry_date).slice(0, 6).map((c) => {
                const remaining = timeRemaining(c.expiry_date);
                return (
                  <div key={c.id} className="list-item row">
                    <span>{c.planet_name || `Planet ${c.planet_id}`}</span>
                    <StatusPill label={remaining.label} tone={remaining.tone} />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
