/**
 * Server-side Smart Lead config loader with short TTL cache.
 */

import dbConnect from "@/lib/db";
import SmartLeadConfig from "@/models/smartLeadConfig";
import {
  getDefaultSmartLeadConfig,
  SMART_LEAD_CONFIG_KEY,
} from "@/lib/smartLead/configDefaults.js";
import { resolveSmartLeadConfig } from "@/lib/smartLead/configResolve.js";

let cache = { at: 0, config: null };
const TTL_MS = 30_000;

export function invalidateSmartLeadConfigCache() {
  cache = { at: 0, config: null };
}

export async function getResolvedSmartLeadConfig({ force = false } = {}) {
  const now = Date.now();
  if (!force && cache.config && now - cache.at < TTL_MS) {
    return cache.config;
  }

  try {
    await dbConnect();
    const doc = await SmartLeadConfig.findOne({ key: SMART_LEAD_CONFIG_KEY }).lean();
    const resolved = resolveSmartLeadConfig(doc || getDefaultSmartLeadConfig());
    cache = { at: now, config: resolved };
    return resolved;
  } catch (err) {
    console.error("getResolvedSmartLeadConfig", err);
    const fallback = getDefaultSmartLeadConfig();
    cache = { at: now, config: fallback };
    return fallback;
  }
}

export async function saveSmartLeadConfig(payload) {
  await dbConnect();
  const resolved = resolveSmartLeadConfig(payload);
  const doc = await SmartLeadConfig.findOneAndUpdate(
    { key: SMART_LEAD_CONFIG_KEY },
    { $set: { ...resolved, key: SMART_LEAD_CONFIG_KEY } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  invalidateSmartLeadConfigCache();
  return resolveSmartLeadConfig(doc);
}
