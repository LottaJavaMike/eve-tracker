import axios from 'axios';
import { esi } from '../esi/client.js';
import { getCharacterRow } from '../esi/token.js';

const TRADE_HUBS = {
  jita: 60003760,
  amarr: 60008494,
  dodixie: 60011866,
  rens: 60004588,
  hek: 60005686,
};

const EVEREF_BASE = 'https://api.everef.net/v1/industry/cost';
const FUZZWORK_BASE = 'https://market.fuzzwork.co.uk/aggregates/';

const typeNameCache = new Map();
async function resolveTypeName(typeId) {
  if (typeNameCache.has(typeId)) return typeNameCache.get(typeId);
  try {
    const { data } = await esi.get(`/universe/types/${typeId}/`);
    typeNameCache.set(typeId, data.name);
    return data.name;
  } catch {
    return null;
  }
}

let costIndexBySystem = null;
async function getCostIndexForSystem(systemId) {
  if (!systemId) return 0;
  if (!costIndexBySystem) {
    const { data } = await esi.get('/industry/systems/');
    costIndexBySystem = new Map(
      data.map((s) => [
        s.solar_system_id,
        Object.fromEntries(s.cost_indices.map((c) => [c.activity, c.cost_index])),
      ])
    );
  }
  return costIndexBySystem.get(systemId)?.manufacturing ?? 0;
}

async function fetchMaterials(blueprintTypeId, me, runs) {
  const { data } = await axios.get(EVEREF_BASE, {
    params: { blueprint_id: blueprintTypeId, me, te: 0, runs },
    timeout: 15000,
  });
  const entries = Object.values(data.manufacturing || {});
  if (entries.length === 0) {
    throw new Error(`No manufacturing data found for blueprint type ${blueprintTypeId}`);
  }
  return entries[0];
}

async function fetchHubPrices(typeIds, hubStationId) {
  const { data } = await axios.get(FUZZWORK_BASE, {
    params: { station: hubStationId, types: typeIds.join(',') },
    timeout: 15000,
  });
  return data;
}

export async function computeIndustryCost({ blueprintTypeId, runs, me, hub }) {
  const hubStationId = TRADE_HUBS[hub] || TRADE_HUBS.jita;

  const manufacturing = await fetchMaterials(blueprintTypeId, me, runs);
  const materialEntries = Object.values(manufacturing.materials);
  const productTypeId = manufacturing.product_id;

  const priceTypeIds = [...materialEntries.map((m) => m.type_id), productTypeId];
  const hubPrices = await fetchHubPrices(priceTypeIds, hubStationId);

  const materials = [];
  let materialCost = 0;
  for (const m of materialEntries) {
    const unitPrice = Number(hubPrices[m.type_id]?.sell?.median || 0);
    const lineCost = m.quantity * unitPrice;
    materialCost += lineCost;
    materials.push({
      type_id: m.type_id,
      name: await resolveTypeName(m.type_id),
      quantity: m.quantity,
      unit_price: unitPrice,
      cost: lineCost,
    });
  }

  const productUnitPrice = Number(hubPrices[productTypeId]?.buy?.median || 0);
  const revenue = manufacturing.units * productUnitPrice;

  const char = getCharacterRow();
  const costIndex = await getCostIndexForSystem(char?.current_system_id);
  const jobCost = costIndex * materialCost;
  const buildCost = materialCost + jobCost;
  const marginIsk = revenue - buildCost;
  const marginPct = buildCost > 0 ? (marginIsk / buildCost) * 100 : null;

  return {
    blueprint_type_id: blueprintTypeId,
    product_type_id: productTypeId,
    product_name: await resolveTypeName(productTypeId),
    units: manufacturing.units,
    hub,
    materials,
    material_cost: materialCost,
    revenue,
    build_cost: buildCost,
    margin_isk: marginIsk,
    margin_pct: marginPct,
    cost_index_pct: costIndex * 100,
    cost_index_note: char?.current_system_id ? null : 'No connected character — assuming 0% cost index',
  };
}
