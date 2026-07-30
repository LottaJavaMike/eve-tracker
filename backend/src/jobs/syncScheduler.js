import cron from 'node-cron';
import { db } from '../db.js';
import { esi, authHeader } from '../esi/client.js';
import { getCharacterRow, getValidAccessToken } from '../esi/token.js';

const ACTIVITY_NAMES = {
  1: 'manufacturing',
  3: 'time_efficiency_research',
  4: 'material_efficiency_research',
  5: 'copying',
  8: 'invention',
  9: 'reaction',
};

const typeNameCache = new Map();
async function resolveTypeName(typeId) {
  if (!typeId) return null;
  if (typeNameCache.has(typeId)) return typeNameCache.get(typeId);
  try {
    const { data } = await esi.get(`/universe/types/${typeId}/`);
    typeNameCache.set(typeId, data.name);
    return data.name;
  } catch {
    return null;
  }
}

const planetNameCache = new Map();
async function resolvePlanetName(planetId) {
  if (planetNameCache.has(planetId)) return planetNameCache.get(planetId);
  try {
    const { data } = await esi.get(`/universe/planets/${planetId}/`);
    planetNameCache.set(planetId, data.name);
    return data.name;
  } catch {
    return null;
  }
}

async function syncIndustryJobs(characterId, token) {
  const { data: jobs } = await esi.get(
    `/characters/${characterId}/industry/jobs/?include_completed=true`,
    authHeader(token)
  );
  const now = new Date().toISOString();
  const upsert = db.prepare(`
    INSERT INTO industry_jobs
      (esi_job_id, activity_type, blueprint_type_id, blueprint_name, output_type_id, output_name,
       runs, status, start_date, end_date, facility_name, cost, source, synced_at)
    VALUES (@esi_job_id, @activity_type, @blueprint_type_id, @blueprint_name, @output_type_id, @output_name,
            @runs, @status, @start_date, @end_date, @facility_name, @cost, 'esi', @synced_at)
    ON CONFLICT(esi_job_id) DO UPDATE SET
      activity_type = excluded.activity_type,
      blueprint_name = excluded.blueprint_name,
      output_name = excluded.output_name,
      runs = excluded.runs,
      status = excluded.status,
      start_date = excluded.start_date,
      end_date = excluded.end_date,
      cost = excluded.cost,
      synced_at = excluded.synced_at
  `);

  for (const job of jobs) {
    const [blueprintName, outputName] = await Promise.all([
      resolveTypeName(job.blueprint_type_id),
      resolveTypeName(job.product_type_id),
    ]);
    upsert.run({
      esi_job_id: job.job_id,
      activity_type: ACTIVITY_NAMES[job.activity_id] || String(job.activity_id),
      blueprint_type_id: job.blueprint_type_id,
      blueprint_name: blueprintName,
      output_type_id: job.product_type_id ?? null,
      output_name: outputName,
      runs: job.runs,
      status: job.status,
      start_date: job.start_date,
      end_date: job.end_date,
      facility_name: `Facility ${job.facility_id}`,
      cost: job.cost ?? null,
      synced_at: now,
    });
  }
  return jobs.length;
}

async function syncBlueprints(characterId, token) {
  const { data: blueprints } = await esi.get(
    `/characters/${characterId}/blueprints/`,
    authHeader(token)
  );
  const now = new Date().toISOString();
  const upsert = db.prepare(`
    INSERT INTO blueprints
      (esi_item_id, type_id, type_name, material_efficiency, time_efficiency, quantity, is_bpo, location_name, synced_at)
    VALUES (@esi_item_id, @type_id, @type_name, @material_efficiency, @time_efficiency, @quantity, @is_bpo, @location_name, @synced_at)
    ON CONFLICT(esi_item_id) DO UPDATE SET
      type_name = excluded.type_name,
      material_efficiency = excluded.material_efficiency,
      time_efficiency = excluded.time_efficiency,
      quantity = excluded.quantity,
      is_bpo = excluded.is_bpo,
      synced_at = excluded.synced_at
  `);

  for (const bp of blueprints) {
    const typeName = await resolveTypeName(bp.type_id);
    upsert.run({
      esi_item_id: bp.item_id,
      type_id: bp.type_id,
      type_name: typeName,
      material_efficiency: bp.material_efficiency,
      time_efficiency: bp.time_efficiency,
      quantity: bp.quantity,
      is_bpo: bp.quantity !== -2 ? 1 : 0,
      location_name: `Location ${bp.location_id}`,
      synced_at: now,
    });
  }
  return blueprints.length;
}

async function syncPlanets(characterId, token) {
  const { data: planets } = await esi.get(`/characters/${characterId}/planets/`, authHeader(token));
  const now = new Date().toISOString();
  const upsert = db.prepare(`
    INSERT INTO pi_colonies
      (planet_id, planet_name, planet_type, upgrade_level, num_pins, expiry_date, synced_at)
    VALUES (@planet_id, @planet_name, @planet_type, @upgrade_level, @num_pins, @expiry_date, @synced_at)
    ON CONFLICT(planet_id) DO UPDATE SET
      planet_name = excluded.planet_name,
      upgrade_level = excluded.upgrade_level,
      num_pins = excluded.num_pins,
      expiry_date = excluded.expiry_date,
      synced_at = excluded.synced_at
  `);

  for (const planet of planets) {
    const planetName = await resolvePlanetName(planet.planet_id);
    let expiryDate = null;
    try {
      const { data: detail } = await esi.get(
        `/characters/${characterId}/planets/${planet.planet_id}/`,
        authHeader(token)
      );
      const expiries = (detail.pins || [])
        .map((p) => p.extractor_details?.expiry_time)
        .filter(Boolean)
        .sort();
      expiryDate = expiries[0] ?? null;
    } catch {
      // non-fatal per-planet detail failure
    }

    upsert.run({
      planet_id: planet.planet_id,
      planet_name: planetName,
      planet_type: planet.planet_type,
      upgrade_level: planet.upgrade_level,
      num_pins: planet.num_pins,
      expiry_date: expiryDate,
      synced_at: now,
    });
  }
  return planets.length;
}

async function syncWallet(characterId, token) {
  const { data: balance } = await esi.get(`/characters/${characterId}/wallet/`, authHeader(token));
  db.prepare('INSERT INTO wallet_snapshots (balance) VALUES (?)').run(balance);
  return balance;
}

const systemNameCache = new Map();
async function resolveSystemName(systemId) {
  if (systemNameCache.has(systemId)) return systemNameCache.get(systemId);
  try {
    const { data } = await esi.get(`/universe/systems/${systemId}/`);
    systemNameCache.set(systemId, data.name);
    return data.name;
  } catch {
    return null;
  }
}

async function syncLocation(characterId, token) {
  const { data: location } = await esi.get(`/characters/${characterId}/location/`, authHeader(token));
  const systemName = await resolveSystemName(location.solar_system_id);
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE character SET current_system_id = ?, current_system_name = ?, location_synced_at = ? WHERE character_id = ?`
  ).run(location.solar_system_id, systemName, now, characterId);
  return systemName;
}

export async function runFullSync() {
  const char = getCharacterRow();
  if (!char) return { skipped: true, reason: 'no character connected' };

  const token = await getValidAccessToken();
  const scopes = char.scopes || '';
  const results = {};

  if (scopes.includes('read_character_jobs')) {
    results.industryJobs = await syncIndustryJobs(char.character_id, token).catch((e) => {
      console.error('Industry job sync failed:', e.message);
      return null;
    });
  }
  if (scopes.includes('read_blueprints')) {
    results.blueprints = await syncBlueprints(char.character_id, token).catch((e) => {
      console.error('Blueprint sync failed:', e.message);
      return null;
    });
  }
  if (scopes.includes('manage_planets')) {
    results.planets = await syncPlanets(char.character_id, token).catch((e) => {
      console.error('PI sync failed:', e.message);
      return null;
    });
  }
  if (scopes.includes('read_character_wallet')) {
    results.wallet = await syncWallet(char.character_id, token).catch((e) => {
      console.error('Wallet sync failed:', e.message);
      return null;
    });
  }
  if (scopes.includes('read_location')) {
    results.location = await syncLocation(char.character_id, token).catch((e) => {
      console.error('Location sync failed:', e.message);
      return null;
    });
  }

  return results;
}

export function startSyncScheduler() {
  cron.schedule('*/10 * * * *', () => {
    runFullSync().catch((err) => console.error('Scheduled sync failed:', err.message));
  });
}
